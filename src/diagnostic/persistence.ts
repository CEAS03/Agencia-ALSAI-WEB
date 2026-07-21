import type { DiagnosticState } from './useDiagnostic';

/**
 * Persistencia del diagnóstico en `sessionStorage`:
 * — Sobrevive a recargas y a que el móvil se bloquee/descargue la pestaña.
 * — Es única por pestaña: cada tarjeta NFC abierta en una pestaña nueva
 *   empieza un diagnóstico limpio.
 * — Se borra sola al cerrar la pestaña.
 */

const KEY = 'alsai.diagnostic.v2';

/** Subconjunto persistible del estado + la posición del adaptador demo. */
export interface Snapshot {
  state: Pick<
    DiagnosticState,
    | 'phase'
    | 'step'
    | 'progress'
    | 'lastAnswer'
    | 'analysisNote'
    | 'lead'
    | 'meeting'
    | 'answers'
    | 'result'
  >;
  /** Índice de la última pregunta servida por el adaptador demo. */
  demoIndex: number;
}

export function saveSnapshot(snap: Snapshot): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(snap));
  } catch {
    /* modo privado o cuota llena: seguimos sin persistir */
  }
}

export function loadSnapshot(): Snapshot | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Snapshot) : null;
  } catch {
    return null;
  }
}

export function clearSnapshot(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
}
