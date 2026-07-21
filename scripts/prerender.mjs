/**
 * ─────────────────────────────────────────────────────────────────────────
 *  PRERENDER ESTÁTICO
 *
 *  Convierte el SPA en HTML real: una página por ruta, con su <head>
 *  completo y el contenido ya renderizado dentro de #root.
 *
 *  Por qué hace falta: el sitio se servía como una sola cáscara vacía con
 *  el mismo <title> para las nueve rutas. Google acaba ejecutando el JS,
 *  pero los rastreadores de WhatsApp, Facebook y LinkedIn no lo hacen
 *  nunca — y WhatsApp es un canal de conversión del negocio. Sin esto,
 *  cada enlace compartido mostraba una vista previa genérica.
 *
 *  Se ejecuta después de los dos `vite build` (cliente y SSR). Ver el
 *  script "build" de package.json.
 *
 *  Salida (plana, para `cleanUrls` de Vercel: /clinicas → clinicas.html):
 *    dist/index.html                dist/casos/blindafon.html
 *    dist/clinicas.html             dist/casos/inmobiliaria.html
 *    dist/soluciones.html           dist/nosotros.html
 *    dist/diagnostico.html          dist/aviso-de-privacidad.html
 *    dist/casos.html                dist/404.html
 *    dist/sitemap.xml               dist/robots.txt
 * ─────────────────────────────────────────────────────────────────────────
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const ssrDir = join(root, 'dist-ssr');

/* El build SSR emite un solo bundle: entry-server reexporta lo necesario. */
const {
  render,
  ROUTES,
  NOT_FOUND_SEO,
  SITE_URL,
  absoluteUrl,
  buildHeadTags,
  sourceForPath,
} = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href);

const template = await readFile(join(distDir, 'index.html'), 'utf8');

/* Manifest de Vite: ruta del sitio → chunk de la página, para precargarlo.
   Sin esto la hidratación tendría que esperar un viaje extra a la red y el
   contenido prerenderizado parpadearía. */
let manifest = {};
try {
  manifest = JSON.parse(await readFile(join(distDir, '.vite', 'manifest.json'), 'utf8'));
} catch {
  console.warn('[prerender] Sin manifest de Vite: se omite el modulepreload por ruta.');
}

function preloadFor(path) {
  const src = sourceForPath(path);
  const file = src && manifest[src]?.file;
  if (!file) return '';
  return `\n    <link rel="modulepreload" crossorigin href="/${file}" />`;
}

/** Ruta del sitio → archivo de salida dentro de dist/. */
function outputFile(path) {
  if (path === '/') return 'index.html';
  return `${path.replace(/^\//, '')}.html`;
}

/**
 * Cáscara del documento, ya sin los comentarios ni las etiquetas de `vite dev`.
 *
 * La limpieza se hace SOLO sobre el template, nunca sobre el HTML de React:
 * renderToString emite comentarios `<!-- -->` entre nodos de texto contiguos
 * y son necesarios para que la hidratación case. Borrarlos rompería la página.
 */
function buildShell(route) {
  const shell = template
    /* Los comentarios del template se van: ahorran bytes en cada página y
       evitan que los reemplazos de abajo encuentren una etiqueta citada
       dentro de un comentario y se lleven por delante su cierre — eso dejaba
       el documento entero comentado. */
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s*<title>[\s\S]*?<\/title>/, '')
    .replace(/\s*<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace('</head>', `  ${buildHeadTags(route)}${preloadFor(route.path)}\n  </head>`);

  /* Red de seguridad: un fallo silencioso aquí publica páginas en blanco. */
  const titles = shell.match(/<title>/g) ?? [];
  if (titles.length !== 1) {
    throw new Error(`[prerender] ${route.path}: se esperaba 1 <title>, hay ${titles.length}.`);
  }
  if (shell.includes('<!--')) {
    throw new Error(`[prerender] ${route.path}: quedó un comentario sin cerrar en el template.`);
  }
  if (!shell.includes('<div id="root"></div>')) {
    throw new Error(`[prerender] ${route.path}: no se encontró el contenedor #root.`);
  }

  return shell;
}

function buildPage(route, appHtml) {
  return buildShell(route).replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
}

/* ── Páginas ─────────────────────────────────────────────────────────────── */

const pages = [...ROUTES, NOT_FOUND_SEO];
let rendered = 0;

for (const route of pages) {
  /* La ruta comodín se prerenderiza pidiendo una URL que no existe. */
  const url = route.path === '/404' ? '/pagina-no-encontrada' : route.path;
  const appHtml = await render(url);

  if (!appHtml || appHtml.length < 500) {
    throw new Error(
      `[prerender] ${route.path} generó HTML vacío o sospechosamente corto ` +
        `(${appHtml.length} bytes). El build se detiene: publicar así dejaría ` +
        `la página sin contenido indexable.`,
    );
  }

  const file = join(distDir, outputFile(route.path));
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, buildPage(route, appHtml), 'utf8');
  rendered += 1;
  console.log(`[prerender] ${route.path.padEnd(22)} → ${outputFile(route.path)} (${appHtml.length} B)`);
}

/* ── sitemap.xml ─────────────────────────────────────────────────────────── */

const today = new Date().toISOString().slice(0, 10);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.filter((r) => r.index !== false)
  .map(
    (r) => `  <url>
    <loc>${absoluteUrl(r.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

await writeFile(join(distDir, 'sitemap.xml'), sitemap, 'utf8');

/* ── robots.txt ──────────────────────────────────────────────────────────── */

/* /assets/ queda explícitamente permitido: Google necesita descargar el JS y
   el CSS para renderizar la página. Bloquearlos es uno de los errores que
   más daño hacen en un SPA. */
const robots = `# Agencia ALSAI — https://www.agencia-alsai.com
User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

await writeFile(join(distDir, 'robots.txt'), robots, 'utf8');

console.log(
  `\n[prerender] ${rendered} páginas + sitemap.xml + robots.txt listos en dist/.`,
);
