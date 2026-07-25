/**
 * ─────────────────────────────────────────────────────────────────────────
 *  CAPA DE ENTREGA DEL DIAGNÓSTICO
 *
 *  El lead es el único activo irrecuperable del sitio: si el POST a n8n se
 *  pierde, nadie se entera de que esa persona existió. Esta capa lo evita
 *  con cuatro defensas en cascada:
 *
 *    1. Timeout duro (`AbortController`). Sin él, un contenedor de Railway
 *       en cold start deja el `fetch` colgado para siempre y la UI atrapada
 *       en "enviando".
 *    2. Reintentos con backoff dentro de la misma sesión.
 *    3. Cola durable en `localStorage` (NO sessionStorage: tiene que
 *       sobrevivir al cierre de la pestaña) que se vacía en la siguiente
 *       visita.
 *    4. `sendBeacon` al ocultar la página: rescata el envío en curso cuando
 *       el usuario cierra antes de que termine el reintento.
 *
 *  Aun así el envío puede fallar del todo; por eso `useDiagnostic` ofrece
 *  además la salida por WhatsApp. La regla es que el lead nunca dependa de
 *  un solo camino.
 * ─────────────────────────────────────────────────────────────────────────
 */

const OUTBOX_KEY = 'alsai.diagnostic.outbox.v1';

/** Un lead pesa ~4 KB; más de esto es cola atascada, no demanda real. */
const MAX_ITEMS = 8;
/** Pasada una semana el lead ya está frío: se descarta para no crecer sin fin. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const TIMEOUT_MS = 12_000;
/** Backoff dentro de la sesión; tras agotarlo el envío pasa a la cola. */
const RETRY_DELAYS_MS = [700, 2_100];

export interface PendingDelivery {
  id: string;
  url: string;
  /** Cuerpo ya serializado: la cola no reinterpreta el payload. */
  body: string;
  createdAt: number;
  attempts: number;
}

const hasWindow = (): boolean => typeof window !== 'undefined';

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/* ── Cola durable ────────────────────────────────────────────────────────── */

function readOutbox(): PendingDelivery[] {
  if (!hasWindow()) return [];
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    const items = raw ? (JSON.parse(raw) as PendingDelivery[]) : [];
    if (!Array.isArray(items)) return [];
    const fresh = items.filter((i) => Date.now() - i.createdAt < MAX_AGE_MS);
    if (fresh.length !== items.length) writeOutbox(fresh);
    return fresh;
  } catch {
    return [];
  }
}

function writeOutbox(items: PendingDelivery[]): void {
  if (!hasWindow()) return;
  try {
    /* Se conservan los más recientes: un lead nuevo vale más que uno viejo
       que ya lleva días fallando. */
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items.slice(-MAX_ITEMS)));
  } catch {
    /* modo privado o cuota llena: seguimos sin cola */
  }
}

function enqueue(url: string, body: string): void {
  const items = readOutbox();
  items.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    body,
    createdAt: Date.now(),
    attempts: 0,
  });
  writeOutbox(items);
}

/** Cuántos envíos siguen pendientes. La UI lo usa para ser honesta. */
export function pendingCount(): number {
  return readOutbox().length;
}

/* ── Envío ───────────────────────────────────────────────────────────────── */

/** Un intento con timeout. Lanza si la red falla o el status no es 2xx. */
async function postOnce(url: string, body: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`webhook ${res.status}`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Entrega con reintentos. Si se agotan, encola y relanza para que la UI
 * pueda ofrecer la salida por WhatsApp: el lead queda en dos sitios.
 */
export async function deliver(url: string, body: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      await postOnce(url, body);
      return;
    } catch (err) {
      lastError = err;
      const wait = RETRY_DELAYS_MS[attempt];
      if (wait !== undefined) await sleep(wait);
    }
  }
  enqueue(url, body);
  throw lastError instanceof Error ? lastError : new Error('webhook: envío fallido');
}

/**
 * Vacía la cola. Se llama al arrancar la app: los leads que fallaron en una
 * visita anterior entran en cuanto el usuario vuelve o recupera la red.
 */
export async function flushOutbox(): Promise<void> {
  if (!hasWindow()) return;
  const items = readOutbox();
  if (items.length === 0) return;

  const survivors: PendingDelivery[] = [];
  for (const item of items) {
    try {
      await postOnce(item.url, item.body);
    } catch {
      const attempts = item.attempts + 1;
      if (attempts < MAX_ATTEMPTS) survivors.push({ ...item, attempts });
    }
  }
  writeOutbox(survivors);
}

/**
 * Último recurso: al ocultarse la página se intenta la cola con `sendBeacon`,
 * que el navegador entrega aunque la pestaña muera. Es fire-and-forget, así
 * que los elementos NO se borran aquí: si el beacon llegó, el siguiente
 * `flushOutbox` recibirá un duplicado que n8n deduplica por `sessionId`.
 * Preferimos un duplicado visible a un lead perdido en silencio.
 */
export function installUnloadFlush(): void {
  if (!hasWindow() || typeof navigator.sendBeacon !== 'function') return;

  const onHide = () => {
    if (document.visibilityState !== 'hidden') return;
    for (const item of readOutbox()) {
      try {
        navigator.sendBeacon(item.url, new Blob([item.body], { type: 'application/json' }));
      } catch {
        /* el beacon es un extra: nunca rompe la salida del usuario */
      }
    }
  };

  document.addEventListener('visibilitychange', onHide);
}
