import { site } from '../config/site';

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  CAPA DE ANALÍTICA Y CONVERSIONES
 *
 *  Un solo `track()` alimenta a todos los destinos configurados. Ninguno es
 *  obligatorio: sin variables de entorno el sitio funciona igual y los
 *  eventos solo se ven en consola durante el desarrollo.
 *
 *  Variables de entorno (ver .env.example):
 *    VITE_GTM_ID          GTM-XXXXXXX     Google Tag Manager
 *    VITE_GA4_ID          G-XXXXXXXXXX    GA4 directo (omitir si usas GTM)
 *    VITE_META_PIXEL_ID   000000000000    Meta Pixel
 *
 *  Si defines GTM, NO definas también GA4: se contarían dos veces los mismos
 *  eventos. Con GTM, GA4 se configura dentro del contenedor.
 *
 *  PII: `track()` descarta cualquier propiedad con pinta de dato personal
 *  (nombre, email, teléfono…). Los eventos describen comportamiento, nunca
 *  a la persona; los datos del lead viajan solo al webhook de n8n.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type AnalyticsEvent =
  /* Conversiones principales */
  | 'primary_cta_click'
  | 'diagnostic_start'
  | 'diagnostic_complete'
  | 'generate_lead'
  | 'whatsapp_click'
  | 'schedule_call_click'
  /* Contexto y micro-conversiones */
  | 'page_view'
  | 'diagnostic_opened'
  | 'formulas_opened'
  | 'routes_cta_clicked'
  | 'contact_save_clicked'
  | 'social_clicked';

/** Eventos que cuentan como conversión (se marcan para Ads/Meta). */
const CONVERSIONS: ReadonlySet<AnalyticsEvent> = new Set<AnalyticsEvent>([
  'diagnostic_complete',
  'generate_lead',
  'whatsapp_click',
  'schedule_call_click',
]);

type EventProps = Record<string, string | number | boolean | undefined>;

type Sink = (event: AnalyticsEvent, props: EventProps) => void;

const env = import.meta.env as Record<string, string | undefined>;

/** Las variables pegadas en paneles externos arrastran BOM y espacios. */
function readEnv(key: string): string {
  return (env[key] ?? '').replace(/^﻿/, '').trim();
}

const GTM_ID = readEnv('VITE_GTM_ID');
const GA4_ID = readEnv('VITE_GA4_ID');
const META_PIXEL_ID = readEnv('VITE_META_PIXEL_ID');

/* ── Higiene de datos ────────────────────────────────────────────────────── */

const PII_KEY = /nombre|name|email|correo|mail|tel|phone|whatsapp|direccion|address|rfc/i;

function sanitize(props: EventProps): EventProps {
  const clean: EventProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    if (PII_KEY.test(key)) continue;
    /* Un string largo casi siempre es texto libre del usuario. */
    if (typeof value === 'string' && value.length > 120) continue;
    clean[key] = value;
  }
  return clean;
}

/* ── Carga de etiquetas externas ─────────────────────────────────────────── */

function injectScript(src: string, id: string): void {
  if (document.getElementById(id)) return;
  const el = document.createElement('script');
  el.id = id;
  el.async = true;
  el.src = src;
  document.head.appendChild(el);
}

type Gtag = (...args: unknown[]) => void;

interface TagWindow extends Window {
  dataLayer?: unknown[];
  gtag?: Gtag;
  fbq?: ((...args: unknown[]) => void) & {
    /** La define fbevents.js al cargar; antes de eso todo va a `queue`. */
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[];
    loaded: boolean;
    version: string;
    push: unknown;
  };
  _fbq?: unknown;
  _hsq?: unknown[];
}

function w(): TagWindow {
  return window as unknown as TagWindow;
}

let initialized = false;

/**
 * Carga las etiquetas configuradas. Se llama una sola vez desde main.tsx,
 * después de que el documento existe y sin bloquear el render: todos los
 * scripts entran con `async`.
 */
export function initAnalytics(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const win = w();
  win.dataLayer = win.dataLayer ?? [];

  if (GTM_ID) {
    win.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    injectScript(`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`, 'gtm-loader');
  } else if (GA4_ID) {
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`, 'ga4-loader');
    /**
     * Tiene que empujar el objeto `arguments`, NO un array. gtag.js reconoce
     * sus comandos por el tipo de lo que llega al dataLayer y solo procesa
     * `[object Arguments]`; con un array normal registra el contenedor, no
     * lanza ningún error en consola… y no envía un solo hit. Por eso esto no
     * puede simplificarse a `push(args)` aunque lo parezca.
     */
    const gtag = function (this: unknown) {
      win.dataLayer!.push(arguments);
    } as Gtag;
    win.gtag = gtag;
    gtag('js', new Date());
    /* El page_view lo emitimos nosotros en cada cambio de ruta del SPA. */
    gtag('config', GA4_ID, { send_page_view: false });
  }

  if (META_PIXEL_ID && !win.fbq) {
    /**
     * Stub oficial de Meta. El detalle que NO se puede simplificar es
     * `callMethod`: mientras fbevents.js no ha cargado, las llamadas se
     * encolan; en cuanto carga, define `callMethod` y a partir de ahí hay
     * que delegar en él. Un stub que siempre encola instala el pixel pero
     * no reporta un solo evento — falla en silencio.
     */
    const fbq = function (this: unknown, ...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
      else fbq.queue.push(args);
    } as NonNullable<TagWindow['fbq']>;

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.push = fbq;

    win.fbq = fbq;
    win._fbq = win._fbq ?? fbq;

    injectScript('https://connect.facebook.net/en_US/fbevents.js', 'meta-pixel-loader');
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }
}

/* ── Destinos ────────────────────────────────────────────────────────────── */

const sinks: Sink[] = [];

/* Consola: solo en desarrollo o con VITE_ANALYTICS_DEBUG=true. */
if (site.integrations.analyticsDebug) {
  sinks.push((event, props) => {
    console.info(`[analytics] ${event}`, props);
  });
}

/* dataLayer — lo consumen GTM y GA4. Único punto de entrada para ambos. */
sinks.push((event, props) => {
  const dl = w().dataLayer;
  if (Array.isArray(dl)) dl.push({ event, ...props });
});

/* GA4 directo, solo cuando no hay GTM (si hubiera, sería doble conteo). */
sinks.push((event, props) => {
  if (GTM_ID || !GA4_ID) return;
  w().gtag?.('event', event, props);
});

/* Meta Pixel: los eventos estándar se mapean; el resto va como personalizado. */
const META_STANDARD: Partial<Record<AnalyticsEvent, string>> = {
  generate_lead: 'Lead',
  diagnostic_start: 'InitiateCheckout',
  diagnostic_complete: 'CompleteRegistration',
  schedule_call_click: 'Schedule',
  whatsapp_click: 'Contact',
};

sinks.push((event, props) => {
  const fbq = w().fbq;
  if (!META_PIXEL_ID || !fbq) return;
  const standard = META_STANDARD[event];
  if (standard) fbq('track', standard, props);
  else fbq('trackCustom', event, props);
});

/**
 * Adaptador HubSpot — preparado, inactivo sin credenciales.
 * Cuando exista el portal: cargar el script de tracking de HubSpot y este
 * sink empujará los eventos a _hsq. Ver README.md § Integraciones.
 */
sinks.push((event, props) => {
  if (!site.integrations.hubspot.portalId) return;
  const hsq = (w()._hsq ??= []);
  hsq.push(['trackCustomBehavioralEvent', { name: event, properties: props }]);
});

/* ── API pública ─────────────────────────────────────────────────────────── */

export function track(event: AnalyticsEvent, props: EventProps = {}): void {
  const payload = sanitize(props);
  if (CONVERSIONS.has(event)) payload.conversion = true;

  for (const sink of sinks) {
    try {
      sink(event, payload);
    } catch {
      /* la analítica jamás rompe la experiencia */
    }
  }
}
