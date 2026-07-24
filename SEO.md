# SEO y medición — Agencia ALSAI

Cómo está montado el SEO del sitio, qué se genera solo y qué hay que
configurar a mano fuera del repositorio.

---

## 1. El problema que resuelve el prerender

El sitio es un SPA de Vite + React. Antes se publicaba como **una sola
cáscara vacía**: las nueve rutas compartían el mismo `<title>`, la misma
descripción y un `<body>` sin contenido. Eso rompía tres cosas:

- **Vistas previas al compartir.** Los rastreadores de WhatsApp, Facebook y
  LinkedIn no ejecutan JavaScript. Cada enlace compartido mostraba un texto
  genérico, y WhatsApp es un canal de conversión del negocio.
- **Indexación.** Google sí ejecuta JS, pero con retraso, y veía nueve URLs
  con metadatos idénticos: contenido duplicado.
- **`robots.txt` y `sitemap.xml`.** La reescritura comodín de `vercel.json`
  los devolvía como HTML con status 200, así que no existían de verdad.

> **Por qué `vercel.json` ya no tiene reescritura comodín.** Ahora cada ruta se
> publica como su propio HTML estático (`scripts/prerender.mjs` + `cleanUrls`),
> así que la reescritura al `index` sobra: era ella la que hacía que
> `/robots.txt` y `/sitemap.xml` respondieran HTML con status 200, y que
> cualquier URL inexistente devolviera 200 en vez de 404.
>
> ⚠️ **No metas comentarios en `vercel.json`.** El esquema de Vercel rechaza
> propiedades extra: una clave `"//"` usada como comentario hace fallar el
> deploy con `Invalid vercel.json - should NOT have additional property "//"`,
> **antes** de que arranque el build (aparece como Error con `Builds . [0ms]`).

La solución es **prerender en tiempo de build**: `scripts/prerender.mjs`
renderiza cada ruta con `react-dom/server` y escribe un HTML real por página.
En el navegador, `src/main.tsx` **hidrata** ese HTML en lugar de repintarlo,
así que el diseño, las animaciones GSAP y el fondo WebGL siguen intactos.

```
npm run build
  ├─ tsc -b                                    typecheck
  ├─ vite build                                bundle de cliente + manifest
  ├─ vite build --ssr src/entry-server.tsx     bundle de prerender
  └─ node scripts/prerender.mjs                10 HTML + sitemap + robots
```

## 2. Dónde se edita cada cosa

| Qué | Archivo |
|---|---|
| Title, description, prioridad y migas de cada ruta | `src/seo/seo.config.ts` |
| JSON-LD (Organization, Person, WebSite, WebPage, Service) | `src/seo/seo.config.ts` |
| Etiquetas del `<head>` que se inyectan en el HTML | `src/seo/head.ts` |
| Head al navegar dentro del SPA | `src/seo/useSeo.ts` |
| Generación de páginas, `sitemap.xml` y `robots.txt` | `scripts/prerender.mjs` |
| Imagen social e iconos | `scripts/assets/*.html` → `npm run gen:assets` |

**Añadir una ruta nueva:** se declara en `src/routes.ts` (tabla compartida
por el cliente y el prerender) y en `ROUTES` de `src/seo/seo.config.ts`.
El sitemap y el HTML se generan solos.

**Regla del JSON-LD:** solo información verificable. Hoy no hay dirección
exacta, teléfono público, reseñas ni perfiles sociales confirmados, así que
esos campos **no existen** en el grafo. Inventarlos es motivo de penalización
manual. Cuando existan, se añaden en `organizationNode()`.

## 3. Imagen social e iconos

`npm run gen:assets` rasteriza las plantillas con el Chrome del sistema (sin
dependencias nuevas: ni puppeteer ni sharp) y produce:

```
public/og/agencia-alsai-og.png     1200 × 630   vista previa social
public/icons/favicon-32.png          32 × 32
public/icons/apple-touch-icon.png   180 × 180
```

Los PNG **se versionan**: no se regeneran en cada build. Si Chrome no está en
la ruta habitual, define `CHROME_PATH`.

## 4. Medición de conversiones

Todo pasa por `track()` en `src/lib/analytics.ts`. Los seis eventos de
conversión:

| Evento | Cuándo se dispara |
|---|---|
| `primary_cta_click` | Clic en el CTA principal (`DiagCta`) |
| `diagnostic_start` | El usuario empieza el cuestionario |
| `diagnostic_complete` | Se calcula el resultado de las 19 preguntas |
| `generate_lead` | Se envía el formulario de datos |
| `whatsapp_click` | Clic en cualquier enlace de WhatsApp |
| `schedule_call_click` | Solicitud de reunión |

`diagnostic_complete` y `generate_lead` son momentos distintos a propósito
(terminar el análisis vs. dejar los datos), así que no se duplican.

`track()` descarta cualquier propiedad con pinta de dato personal antes de
enviarla. Los datos del lead viajan **solo** al webhook de n8n.

### Variables de entorno

```
VITE_GTM_ID          GTM-XXXXXXX     Google Tag Manager
VITE_GA4_ID          G-XXXXXXXXXX    GA4 directo
VITE_META_PIXEL_ID   000000000000    Meta Pixel
```

> **Usa GTM *o* GA4 directo, nunca los dos.** Con ambos definidos cada evento
> se cuenta por duplicado. Con GTM, GA4 se configura dentro del contenedor.

Sin variables el sitio funciona igual y los eventos solo se ven en consola.

## 5. Configuración externa pendiente

Esto no vive en el repositorio y hay que hacerlo a mano:

1. **Google Search Console** — dar de alta `https://www.agencia-alsai.com`,
   verificar la propiedad y enviar `/sitemap.xml`.
2. **Analítica** — crear la propiedad GA4 (o el contenedor GTM) y poner el ID
   en las variables de entorno de Vercel. Marcar como conversiones:
   `generate_lead`, `diagnostic_complete`, `whatsapp_click` y
   `schedule_call_click`.
3. **Meta Pixel** — si se van a usar campañas de Meta, crear el pixel y añadir
   `VITE_META_PIXEL_ID`.
4. **Datos que faltan en `src/config/site.ts`** — solo quedan las URLs de
   **Instagram y LinkedIn**; esos dos botones del pie siguen avisando "muy
   pronto". Cuando existan, entran también como `sameAs` en el JSON-LD.
   Ya cableados (2026-07-23): teléfono, correo, enlace de WhatsApp y foto de
   Carlos. El teléfono y el correo alimentan la vCard y el nodo
   `Organization` (`telephone`, `email`, `contactPoint`); la foto alimenta
   `Person.image`.
5. **Dirección con calle y CP, y horarios de atención** — faltan para
   completar `PostalAddress` y `openingHours` del negocio local.
