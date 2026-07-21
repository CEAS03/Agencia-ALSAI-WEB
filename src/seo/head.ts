import {
  absoluteUrl,
  buildJsonLd,
  OG_IMAGE_ALT,
  OG_IMAGE_PATH,
  SITE_LOCALE,
  SITE_NAME,
  type RouteSeo,
} from './seo.config';

/**
 * Construye el bloque <head> SEO de una ruta como texto.
 * Lo usa scripts/prerender.mjs para escribirlo en el HTML estático: así el
 * title, el canonical, las Open Graph y el JSON-LD viajan en la respuesta
 * HTTP y no dependen de que el rastreador ejecute JavaScript. Los
 * rastreadores de WhatsApp, Facebook y LinkedIn nunca lo ejecutan.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** El JSON-LD va dentro de <script>: solo hay que romper una etiqueta de cierre. */
function escapeJsonLd(value: string): string {
  return value.replace(/</g, '\\u003c');
}

export function buildHeadTags(route: RouteSeo): string {
  const canonical = absoluteUrl(route.path);
  const ogImage = absoluteUrl(OG_IMAGE_PATH);
  const indexable = route.index !== false;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    /* La 404 no lleva canonical: se sirve en muchas URLs distintas y
       apuntarlas todas a /404 solo confundiría al rastreador. */
    indexable ? `<link rel="canonical" href="${canonical}" />` : '',
    `<meta name="robots" content="${
      indexable ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' : 'noindex, follow'
    }" />`,
    `<meta name="author" content="${SITE_NAME}" />`,
    `<meta name="geo.region" content="MX-QUE" />`,
    `<meta name="geo.placename" content="Querétaro" />`,

    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="${SITE_LOCALE}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />`,

    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />`,

    `<script type="application/ld+json">${escapeJsonLd(buildJsonLd(route))}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ');
}
