# Tarjeta digital — Agencia ALSAI

Landing móvil premium que funciona como tarjeta de presentación digital (NFC / código QR)
de **Agencia ALSAI**. Presenta la agencia sobre un ecosistema empresarial 3D vivo e incluye
la experiencia visual del **diagnóstico exprés**, lista para conectarse a un agente real en n8n.

- **Stack:** Vite + React 18 + TypeScript · Three.js (fondo) · GSAP (coreografías) · CSS moderno.
- **Deploy:** Netlify (configurado en `netlify.toml`).
- **Decisiones de diseño:** ver [`DESIGN_BLUEPRINT.md`](./DESIGN_BLUEPRINT.md).
- **Integración del diagnóstico:** ver [`INTEGRATION_N8N.md`](./INTEGRATION_N8N.md).

---

## Instalación y ejecución

```bash
npm install
npm run dev        # desarrollo → http://localhost:5183
npm run build      # build de producción (tsc + vite) → dist/
npm run preview    # sirve el build localmente
```

Sin configuración adicional la landing funciona completa en **modo demo**: el diagnóstico
recorre un guion local (`src/diagnostic/demoScript.ts`) sin tocar la red.

## Despliegue en Netlify

1. Sube el repositorio a GitHub/GitLab y crea un sitio en Netlify apuntando a él
   (build `npm run build`, publish `dist` — ya definidos en `netlify.toml`),
   o arrastra la carpeta `dist/` en <https://app.netlify.com/drop>.
2. En **Site settings → Environment variables** agrega las variables de `.env.example`
   cuando existan (webhook de n8n, HubSpot).
3. Redeploy. Sin variables, el sitio queda en modo demo, sin errores.

---

## Personalización (un solo archivo)

Todo lo editable vive en **`src/config/site.ts`**:

| Qué | Campo |
|---|---|
| Nombre / cargo / ubicación | `founder.name`, `founder.role`, `founder.location` |
| **Fotografía de Carlos** | coloca el archivo en `public/` (p. ej. `public/carlos.jpg`) y pon `founder.photoSrc: '/carlos.jpg'` |
| Teléfono y correo (vCard) | `founder.phone`, `founder.email` — mientras estén vacíos, el botón «Guardar contacto» avisa "muy pronto" |
| **Logo** | exporta tu SVG/PNG a `public/` y pon `brand.logoSrc: '/logo.svg'` (null = wordmark tipográfico) |
| Propuesta de valor / copy | `brand.headline`, `brand.valueProp`, `brand.tagline`, `brand.audience` |
| Sitio web, Instagram, LinkedIn, WhatsApp, aviso de privacidad | `links.*` — mientras estén vacíos, los botones muestran un aviso elegante en lugar de enlaces rotos |

Los nodos del fondo y sus rutas de conexión se editan en `src/scene/defs.ts`
(posiciones, iconos y secuencias `ECO_ROUTES`) sin tocar la escena.

## Variables de entorno

Copia `.env.example` a `.env`:

| Variable | Uso |
|---|---|
| `VITE_N8N_WEBHOOK_URL` | Webhook del agente de diagnóstico. Vacío = modo demo. |
| `VITE_HUBSPOT_PORTAL_ID` | Activa el sink de HubSpot en la capa de analítica. |
| `VITE_ANALYTICS_DEBUG` | `true` imprime los eventos en consola. |

## Analítica

`src/lib/analytics.ts` emite estos eventos a todos los sinks disponibles
(consola en dev, `dataLayer` si existe, HubSpot si hay portal):

`landing_view` · `diagnostic_opened` · `diagnostic_started` · `lead_form_completed` ·
`diagnostic_completed` · `contact_save_clicked` · `meeting_requested` ·
`website_clicked` · `social_clicked`

**Conectar HubSpot después:** añade el script de tracking de HubSpot en `index.html`
(o cárgalo desde un loader) y define `VITE_HUBSPOT_PORTAL_ID`; el sink ya empuja los
eventos a `_hsq` como *custom behavioral events*. Sin credenciales, el adaptador queda
inactivo sin producir errores.

## Estructura

```
src/
  config/site.ts           ← ÚNICO lugar con datos editables
  scene/                   ← fondo WebGL independiente (EcosystemScene + defs + fallback)
  components/              ← hero, flujo, fundador, footer, iconos SVG propios
  diagnostic/              ← experiencia del diagnóstico + adaptadores demo/n8n
  lib/                     ← analítica, toasts, vCard, reveals
  styles/                  ← tokens de diseño + estilos por capa
```

## Rendimiento y accesibilidad

- Texturas generadas en runtime (sin descargas), `pixelRatio ≤ 2`, ≤ 2 rutas de conexión
  simultáneas, rAF pausado cuando la pestaña está oculta.
- `prefers-reduced-motion`: deriva, impulsos y parallax desactivados manteniendo la identidad.
- Sin WebGL: fallback CSS/SVG automático.
- Áreas táctiles ≥ 44 px, labels visibles, validación inline, safe-areas iOS respetadas.
