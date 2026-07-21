import { site } from '../config/site';

/**
 * Capa de analítica desacoplada.
 * Los eventos se emiten a todos los "sinks" registrados; ningún sink
 * ausente o sin credenciales produce errores.
 */

export type AnalyticsEvent =
  | 'landing_view'
  | 'page_view'
  | 'diagnostic_opened'
  | 'diagnostic_started'
  | 'diagnostic_result_shown'
  | 'formulas_opened'
  | 'routes_cta_clicked'
  | 'lead_form_completed'
  | 'diagnostic_completed'
  | 'contact_save_clicked'
  | 'meeting_requested'
  | 'website_clicked'
  | 'social_clicked'
  | 'blindafon_bot_clicked';

type EventProps = Record<string, string | number | boolean | undefined>;

type Sink = (event: AnalyticsEvent, props: EventProps) => void;

const sinks: Sink[] = [];

/* Sink de consola (solo con VITE_ANALYTICS_DEBUG o en dev) */
if (site.integrations.analyticsDebug) {
  sinks.push((event, props) => {
    console.info(`[analytics] ${event}`, props);
  });
}

/* Sink dataLayer (GTM), si existe en la página */
sinks.push((event, props) => {
  const dl = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dl)) dl.push({ event, ...props });
});

/**
 * Adaptador HubSpot — preparado, inactivo sin credenciales.
 * Cuando exista el portal: cargar el script de tracking de HubSpot en
 * index.html (o vía loader) y este sink empujará los eventos a _hsq.
 * Ver README.md § Integraciones.
 */
sinks.push((event, props) => {
  if (!site.integrations.hubspot.portalId) return;
  const hsq = ((window as unknown as { _hsq?: unknown[] })._hsq ??= []);
  hsq.push(['trackCustomBehavioralEvent', { name: event, properties: props }]);
});

export function track(event: AnalyticsEvent, props: EventProps = {}): void {
  for (const sink of sinks) {
    try {
      sink(event, props);
    } catch {
      /* la analítica jamás rompe la experiencia */
    }
  }
}
