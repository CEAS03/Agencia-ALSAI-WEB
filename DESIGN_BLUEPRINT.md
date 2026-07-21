# DESIGN BLUEPRINT — Tarjeta digital de Agencia ALSAI

Documento de decisiones de diseño y arquitectura, previo a la implementación.
Skills aplicadas: `taste-skill` (anti-slop, asimetría, física de motion), `web-design-emil-kowalski`
(easings custom, duraciones, interrupciones, detalle invisible) y `ui-ux-pro-max`
(prioridades: accesibilidad, touch targets, safe areas, tipografía, motion 150–300ms).

---

## 1. Dirección visual

**Concepto: "El sistema nervioso de una clínica".**
La landing no muestra tecnología decorativa: muestra un ecosistema operativo vivo. El fondo es
una red tridimensional de módulos (WhatsApp, CRM, agenda, marketing…) que se conectan entre sí
mediante impulsos de luz con rutas de negocio reales. El contenido flota sobre ese sistema,
con jerarquía asimétrica y mucho espacio negativo.

- **Fondo:** azul marino casi negro `#040A16` con niebla azul profunda. Nunca `#000000` puro.
- **Color primario de energía:** azul eléctrico `#4D9DFF` → cian `#37E2E4` (conexiones, pulsos).
- **Acento moderado:** violeta `#8B7CF6` (estados de análisis / IA).
- **Éxito / procesos completados:** verde turquesa `#2EE6C3`.
- **Texto:** blanco azulado `#EAF2FF` sobre fondo; secundario `#8FA3C4`.
- **Materiales:** discos de cristal oscuro con anillo luminoso fino, líneas de 1px con bloom
  contenido, sin neón saturado ni estética gamer.
- **Tipografía:** `Space Grotesk` (display, tracking apretado) + `Outfit` (texto). Nada de Inter.
- **Layout:** hero alineado a la izquierda (variance alta, prohibido hero centrado genérico),
  módulo del fundador como pieza secundaria integrada, narrativa compacta de ~2.5 pantallas.
- **Iconografía:** SVG de trazo propio, cero emojis, cero robots/cerebros/binario.

## 2. Distribución de iconos (fondo)

12 conceptos + 4 puntos ambientales, distribuidos por TODO el fondo sin núcleo central.
Coordenadas normalizadas (nx relativo al ancho visible en su profundidad z, ny en unidades de
mundo, z = profundidad: mayor = más cerca). La zona central del hero queda despejada por un
atenuador elíptico de legibilidad (los nodos que cruzan detrás del texto bajan su brillo).

| Nodo | nx | ny | z | Capa |
|---|---|---|---|---|
| WhatsApp | -0.72 | 3.6 | 1.2 | cercana |
| IA | 0.55 | 4.4 | -0.8 | media |
| CRM | 0.78 | 2.2 | 0.4 | cercana |
| Agenda | -0.5 | 0.9 | -1.8 | lejana |
| Prospectos | 0.62 | -0.6 | -1.2 | media |
| Marketing | -0.78 | -1.6 | 0.8 | cercana |
| Seguimiento | 0.4 | -2.8 | -0.4 | media |
| Reseñas | -0.35 | -4.2 | -1.6 | lejana |
| Administración | 0.75 | -4.8 | 0.6 | cercana |
| Ventas | -0.68 | -6.2 | -0.6 | media |
| Automatización | 0.3 | -7.2 | 0.9 | cercana |
| Analítica | -0.25 | -8.0 | -1.4 | lejana |

Los nodos lejanos usan textura suavizada (pre-blur) y opacidad 0.3–0.5 para profundidad real.
Deriva orgánica por nodo: `sin/cos` con fase, amplitud y frecuencia individuales (±0.15 u,
periodos 9–16 s) — casi imperceptible, como respiración.

## 3. Secuencias de conexión

Rutas de datos **configurables** (`src/scene/routes.ts`), con significado de negocio:

1. `WhatsApp → IA → CRM` — un mensaje se atiende y se registra.
2. `CRM → Agenda → Seguimiento` — el prospecto se agenda y se le da seguimiento.
3. `Marketing → Prospectos → Ventas` — una campaña produce pacientes.
4. `Agenda → Seguimiento → Reseñas` — la cita confirmada termina en reseña.
5. `Analítica → Marketing → Automatización` — los datos optimizan el sistema.
6. `IA → Automatización → Administración` — la IA quita carga administrativa.

Ciclo de una conexión (por tramo): aproximación sutil de nodos → trazo de línea fina
(dibujada con `uDraw`, 450 ms) → impulso de luz recorre la curva (sprite aditivo, 700 ms) →
la conexión respira activa 2.5 s → decae 800 ms. Un scheduler round-robin lanza una ruta cada
~4.5 s (máx. 2 rutas simultáneas). Tocar un nodo lo enciende y dispara su ruta asociada.

**Estados del fondo** (el fondo reacciona a la página): `hero` (tempo normal, azul/cian),
`diagnostic` (brillo 0.55, tinte violeta, tempo lento), `analysis` (ráfaga de 2 rutas, tempo
rápido) y `success` (ruta en verde turquesa). API interna: `scene.setMode(mode)`.

## 4. Arquitectura de animaciones

Sistema único de movimiento con tokens (`tokens.css`):

- `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` — entradas y feedback (nunca ease-in).
- `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` — morphs y movimiento en pantalla.
- `--ease-panel: cubic-bezier(0.32, 0.72, 0, 1)` — apertura/cierre del diagnóstico (tipo iOS).
- Duraciones: press 140 ms · chips/hover 180 ms · reveals 400–600 ms · panel 480 ms.

Coreografías:
- **Entrada (GSAP, ~1.5 s):** los nodos del fondo se encienden en stagger (40 ms) → wordmark
  ALSAI aparece por letras (translateY 18px + blur 8→0, stagger 45 ms) → propuesta de valor →
  el CTA principal "se dibuja": su luz perimetral recorre el borde (stroke-dashoffset) y queda
  orbitando en loop. La primera ruta del fondo se dispara al terminar, como si el sistema despertara.
- **CTA principal:** luz perimetral orbital permanente + respiración de glow. `:active`
  scale(0.97) 140 ms. Al tocarlo, el botón se expande (FLIP desde su rect real hasta pantalla
  completa, radio 999→0, `--ease-panel` 480 ms) con crossfade + blur(6px) del contenido.
- **Diagnóstico:** cambios de etapa con salida rápida (200 ms) y entrada suave (400 ms),
  chips en stagger 40 ms, tarjeta de análisis con línea de escaneo (linear, loop), progreso
  de áreas con relleno `--ease-in-out`, éxito con sello dibujado (stroke) en turquesa.
- **Scroll:** revelado de módulos con IntersectionObserver (translateY 14px + opacity,
  una sola vez); el fondo gana profundidad (cámara z −1.2 u a lo largo del scroll). Sin
  scroll-hijacking.
- **Reduced motion:** deriva y pulsos desactivados; las conexiones aparecen/desaparecen por
  opacidad; entradas solo con fade corto. La identidad visual se mantiene.
- Solo se animan `transform`, `opacity`, `clip-path` y uniforms WebGL. Nada de width/height/top.

## 5. Experiencia del diagnóstico

No es un chatbot de esquina: es una **consola de análisis de la clínica**, pantalla completa
en móvil, con el ecosistema visible atenuado detrás.

Etapas (máquina de estados `closed → opening → welcome → question ⇄ analyzing → lead →
submitting → ready`):

1. **Bienvenida:** marca de diagnóstico + "Diagnóstico exprés · 2 minutos" + riel de 5 áreas
   (Atención, Agenda, Seguimiento, Marketing, Administración).
2. **Preguntas (5, una por área):** módulos dinámicos —la pregunta en grande, chips de
   respuesta rápida; la última pregunta acepta texto libre con input completamente diseñado.
   Cada respuesta colapsa a una línea de registro y dispara una **tarjeta de análisis** con
   escaneo (1.4 s) mientras el riel avanza y el fondo entra en modo `analysis`.
3. **Captura elegante:** nombre, clínica, WhatsApp, correo (opcional), consentimiento con
   enlace al aviso de privacidad. Labels arriba, validación inline, estados de error/carga.
4. **Cierre:** estado de éxito (fondo en modo `success`) + botón "Solicitar reunión"
   preparado (`requestMeeting()` → evento para n8n). El resultado real lo entregará n8n después.

**Modo demo** separado del código de producción: `DemoAdapter` implementa la misma interfaz
que `N8nAdapter` (`startSession / sendMessage / submitLead / requestMeeting`) y sirve el guion
local. Si `VITE_N8N_WEBHOOK_URL` existe, se usa el adaptador real sin tocar la UI.

## 6. Tecnología final

- **Vite + React 18 + TypeScript** — base solicitada.
- **Three.js puro** (sin React Three Fiber): el fondo es un único sistema imperativo con
  scheduler propio de conexiones; una clase `EcosystemScene` da control total del loop y evita
  el overhead del reconciler para algo que no es declarativo. *(Razón técnica del cambio
  permitido por el brief.)*
- **GSAP** para coreografías (entrada, morph del CTA, etapas del diagnóstico).
- **CSS moderno** (custom properties, `@starting-style` no requerido, transitions) para
  microinteracciones.
- **@fontsource-variable** para Space Grotesk y Outfit (self-hosted, sin CDN).
- Sin librerías redundantes: nada de framer-motion, styled-components ni UI kits.
- Deploy: **Netlify** (`netlify.toml`, SPA redirect, build `npm run build`).

Presupuesto de rendimiento: ≤ 20 sprites + ≤ 6 líneas activas + ≤ 4 sprites de pulso,
`pixelRatio ≤ 2`, texturas 256px generadas en runtime (sin descargas), rAF pausado con
`visibilitychange`, raycast solo en eventos de puntero. Fallback sin WebGL: composición CSS
de gradientes + constelación SVG estática con pulsos de opacidad.
