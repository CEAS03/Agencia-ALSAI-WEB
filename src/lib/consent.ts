/**
 * ─────────────────────────────────────────────────────────────────────────
 *  CONSENTIMIENTO DE COOKIES  (Google Consent Mode v2)
 *
 *  El sitio carga GA4 y Meta Pixel. Ambos escriben cookies de medición y
 *  publicidad, así que arrancan DENEGADOS y solo se conceden si la persona
 *  lo acepta. Con Consent Mode v2 GA sigue recibiendo pings sin cookies
 *  mientras tanto (conserva el modelado de conversiones) y el Pixel de Meta
 *  ni siquiera se descarga hasta que hay permiso.
 *
 *  La decisión se guarda en `localStorage`: sobrevive al cierre de pestaña
 *  y evita volver a preguntar en cada visita.
 * ─────────────────────────────────────────────────────────────────────────
 */

const KEY = 'alsai.consent.v1';

export type ConsentDecision = 'granted' | 'denied';

/** null = todavía no ha decidido; hay que mostrar el aviso. */
export function readConsent(): ConsentDecision | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw === 'granted' || raw === 'denied' ? raw : null;
  } catch {
    /* modo privado: no recordamos la decisión, pero tampoco rastreamos */
    return null;
  }
}

export function saveConsent(decision: ConsentDecision): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, decision);
  } catch {
    /* no-op */
  }
}
