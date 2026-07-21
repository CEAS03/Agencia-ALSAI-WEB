import type { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
/* En react-router v7 StaticRouter vive en la raíz del paquete;
   el antiguo 'react-router-dom/server' ya no existe. */
import { StaticRouter } from 'react-router';
import App from './App';
import { routeDefs } from './routes';

/* El build SSR produce un único bundle, así que scripts/prerender.mjs toma
   de aquí todo lo que necesita en vez de importar cada módulo por separado. */
export {
  ROUTES,
  NOT_FOUND_SEO,
  SITE_URL,
  absoluteUrl,
} from './seo/seo.config';
export { buildHeadTags } from './seo/head';
export { sourceForPath } from './routes';

/**
 * Entrada de prerender. Se ejecuta en Node durante el build (nunca en
 * producción) y devuelve el HTML de una ruta ya resuelta.
 *
 * Nota sobre StrictMode: aquí se omite a propósito. En el cliente sí está,
 * pero en el servidor solo duplicaría el trabajo de render sin aportar nada
 * — no hay efectos que ejecutar.
 */
export async function render(url: string): Promise<string> {
  /* Todas las páginas se resuelven antes de renderizar: renderToString no
     sabe esperar a un import dinámico y devolvería el fallback vacío. */
  const resolved = new Map<string, ComponentType>();
  await Promise.all(
    routeDefs.map(async (def) => {
      if (!def.load) return;
      const mod = await def.load();
      resolved.set(def.path as string, mod.default);
    }),
  );

  return renderToString(
    <StaticRouter location={url}>
      <App resolved={resolved} />
    </StaticRouter>,
  );
}
