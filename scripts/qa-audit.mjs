/**
 * ─────────────────────────────────────────────────────────────────────────
 *  AUDITORÍA QA END-TO-END DEL DIAGNÓSTICO — contra producción
 *
 *  Recorre el diagnóstico completo como una persona real, captura toda la
 *  red y la consola, y verifica que el lead salga hacia n8n con 2xx.
 *
 *    node scripts/qa-audit.mjs desktop
 *    node scripts/qa-audit.mjs mobile
 *    node scripts/qa-audit.mjs landing
 *
 *  El viewport se fija con `context.viewport`, que Playwright aplica por
 *  DevTools Protocol (Emulation.setDeviceMetricsOverride). Es la vía
 *  correcta: `--window-size` por debajo de 500 px miente en Windows y
 *  recorta el layout en vez de emularlo.
 *
 *  NO se acelera el recorrido a propósito: el filtro anti-spam de n8n exige
 *  elapsed_ms > 15000, así que terminar antes haría que el lead se
 *  rechazara legítimamente y el test mentiría.
 *
 *  Salida: qa-out/<perfil>/report.json + capturas PNG.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PROFILE = process.argv[2] ?? 'desktop';
const SITE = process.env.QA_SITE ?? 'https://www.agencia-alsai.com';
const LANDING = process.env.QA_LANDING ?? 'https://conecta.agencia-alsai.com';
const WEBHOOK_HOST = 'primary-production-48856.up.railway.app';

const STAMP = process.env.QA_STAMP ?? String(Date.now());
const LEAD = {
  name: 'QA Auditoria Automatizada',
  clinic: 'CLINICA DE PRUEBA - BORRAR',
  whatsapp: '4420000000',
  email: process.env.QA_EMAIL ?? `qa-auditoria+${STAMP}@agencia-alsai.com`,
};

const OUT = path.join(ROOT, 'qa-out', PROFILE);

/* ── Guion de respuestas ─────────────────────────────────────────────────
   Elegidas para que el motor entre en modo "pesos" (valor de cita y de
   tratamiento respondidos): así Sheets, Gmail y HubSpot reciben el paquete
   completo y la auditoría prueba el camino real, no uno degradado. */
const ANSWERS = {
  'q1-tipo': ['Clínica dental'],
  'q2-agenda': ['La ocupación es irregular: algunos días se llenan y otros quedan vacíos'],
  'q3-volumen': ['Entre 25 y 50'],
  'q4-origen': ['Recomendaciones de otros pacientes', 'Google o Google Maps', 'Instagram, Facebook o TikTok'],
  'q5-medios': ['WhatsApp', 'Llamada telefónica'],
  'q6-publicidad': ['Entre $2,000 y $5,000 MXN al mes'],
  'q7-respuesta-dentro': ['Entre 16 y 60 minutos'],
  'q8-respuesta-fuera': ['Al comenzar el siguiente horario de atención'],
  'q9-conversion-citas': [4],
  'q10-seguimiento': ['Algunas veces recibe seguimiento y otras se pierde'],
  'q11-citas': ['Entre 50 y 125'],
  'q12-ausencias': [2],
  'q13-valor-cita': ['Entre $500 y $1,000 MXN'],
  'q14-conversion-tratamiento': [5],
  'q15-tratamientos-pendientes': ['Algunas veces se le da seguimiento y otras se pierde'],
  'q16-valor-tratamiento': ['Entre $4,000 y $7,500 MXN'],
  'q17-recuperacion': ['Se le contacta solo en algunas ocasiones'],
  'q18-sistemas': ['Utilizamos varios sistemas que no se comunican entre sí'],
  'q19-prioridad': ['Convertir más solicitudes en citas', 'Reducir cancelaciones y ausencias'],
};

/* ── Utilidades ──────────────────────────────────────────────────────────── */

const report = {
  perfil: PROFILE,
  iniciado: new Date().toISOString(),
  lead: LEAD,
  checks: [],
  pasos: [],
  red: [],
  webhookPosts: [],
  consola: [],
  errores: [],
  dataLayer: [],
  tiempos: {},
  capturas: [],
  notas: [],
};

function check(id, ok, detalle) {
  report.checks.push({ id, ok, detalle });
  console.log(`${ok ? '✅' : '❌'} ${id} — ${detalle}`);
  return ok;
}

/** No aplicable en este entorno. No cuenta como fallo, pero se ve en el log. */
function omitido(id, motivo) {
  report.checks.push({ id, ok: true, omitido: true, detalle: motivo });
  console.log(`⏭️  ${id} — omitido: ${motivo}`);
}

/** Una build sin `VITE_N8N_WEBHOOK_URL` corre en modo demo y no toca la red. */
const esDemo = () => report.webhookPosts.length === 0 && /localhost|127\.0\.0\.1/.test(SITE);

async function shot(page, nombre) {
  const file = path.join(OUT, `${nombre}.png`);
  await page.screenshot({ path: file, fullPage: false });
  report.capturas.push(path.relative(ROOT, file));
}

const readState = (page) =>
  page.evaluate(() => {
    try {
      return JSON.parse(sessionStorage.getItem('alsai.diagnostic.v2') ?? 'null');
    } catch {
      return null;
    }
  });

/** Lee el dataLayer aplanando los `arguments` que empuja gtag. */
const readDataLayer = (page) =>
  page.evaluate(() => {
    const dl = window.dataLayer;
    if (!Array.isArray(dl)) return [];
    return dl.map((entry) => {
      if (entry && typeof entry === 'object' && !Array.isArray(entry) && 'length' in entry) {
        return { __gtag: Array.from(entry).map((v) => (typeof v === 'object' ? v : String(v))) };
      }
      try {
        return JSON.parse(JSON.stringify(entry));
      } catch {
        return { __unserializable: true };
      }
    });
  });

/**
 * Clic por texto EXACTO. Dos motivos para no usar `hasText`:
 *  — hace substring y hay opciones que son prefijo de otras;
 *  — `useStagedKey` deja el panel anterior 170 ms en el DOM y la fase
 *    "analyzing" dura ~1.4 s, así que hay que esperar a que la opción
 *    concreta exista, no solo a que existan opciones.
 */
async function clickExact(page, selector, texto, timeout = 20_000) {
  const t0 = Date.now();
  let vistos = [];
  while (Date.now() - t0 < timeout) {
    const idx = await page.evaluate(
      ([sel, t]) => [...document.querySelectorAll(sel)].findIndex((e) => e.textContent.trim() === t),
      [selector, texto],
    );
    if (idx >= 0) {
      await page.locator(selector).nth(idx).click();
      return;
    }
    vistos = await page.$$eval(selector, (els) => els.map((e) => e.textContent.trim()));
    await page.waitForTimeout(120);
  }
  throw new Error(`No apareció ${selector} con texto "${texto}" en ${timeout}ms. Presentes: ${JSON.stringify(vistos)}`);
}

async function waitForPhaseChange(page, prevStepId, timeout = 45_000) {
  const t0 = Date.now();
  let ultimo = null;
  while (Date.now() - t0 < timeout) {
    const snap = await readState(page);
    if (snap?.state) {
      ultimo = snap.state;
      const { phase, step } = ultimo;
      if (phase === 'resultado' || phase === 'lead' || phase === 'ready') return ultimo;
      if (phase === 'question' && step && step.id !== prevStepId) return ultimo;
    }
    await page.waitForTimeout(120);
  }
  throw new Error(`Timeout esperando avance tras "${prevStepId}". Último estado: ${JSON.stringify(ultimo?.phase)}`);
}

/* ── Instrumentación ─────────────────────────────────────────────────────── */

function instrument(page) {
  page.on('console', (msg) => {
    report.consola.push({ tipo: msg.type(), texto: msg.text().slice(0, 500) });
    if (msg.type() === 'error') report.errores.push({ origen: 'console', texto: msg.text().slice(0, 500) });
  });
  page.on('pageerror', (err) => {
    report.errores.push({ origen: 'pageerror', texto: String(err).slice(0, 500) });
  });
  page.on('requestfailed', (req) => {
    report.errores.push({
      origen: 'requestfailed',
      texto: `${req.method()} ${req.url()} — ${req.failure()?.errorText}`,
    });
  });
  page.on('response', async (res) => {
    const req = res.request();
    const url = res.url();
    const fila = { metodo: req.method(), url, status: res.status(), tipo: req.resourceType() };
    report.red.push(fila);

    if (url.includes(WEBHOOK_HOST)) {
      let body = null;
      try {
        body = JSON.parse(req.postData() ?? 'null');
      } catch {
        body = { __raw: req.postData()?.slice(0, 2000) ?? null };
      }
      let respuesta = null;
      try {
        respuesta = (await res.text()).slice(0, 500);
      } catch {
        /* respuesta ya consumida o vacía */
      }
      report.webhookPosts.push({
        status: res.status(),
        tipo_evento: body?.type ?? null,
        firma_presente: Boolean(body?.firma),
        firma_len: body?.firma ? String(body.firma).length : 0,
        elapsed_ms: body?.elapsed_ms ?? null,
        hp: body?.hp ?? null,
        sessionId: body?.sessionId ?? null,
        lead: body?.lead ?? null,
        resultado_modo: body?.resultado?.impacto?.modo ?? null,
        resultado_meta: body?.resultado?.meta
          ? {
              tipo_clinica: body.resultado.meta.tipo_clinica,
              infraestructura: body.resultado.meta.infraestructura,
              objetivo_90d: body.resultado.meta.objetivo_90d,
              n_respuestas: Object.keys(body.resultado.meta.respuestas_crudas ?? {}).length,
            }
          : null,
        respuesta,
      });
    }
  });
}

/* ── Recorrido completo del diagnóstico ──────────────────────────────────── */

async function correrDiagnostico(page) {
  const t0 = Date.now();

  await page.goto(`${SITE}/diagnostico`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  report.tiempos.carga_ms = Date.now() - t0;

  const vp = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    dpr: window.devicePixelRatio,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  report.viewport = vp;
  check('viewport', vp.innerWidth === (PROFILE === 'mobile' ? 375 : 1440), `innerWidth=${vp.innerWidth}`);
  check(
    'sin-overflow-horizontal',
    vp.scrollWidth <= vp.innerWidth + 1,
    `scrollWidth=${vp.scrollWidth} vs innerWidth=${vp.innerWidth}`,
  );

  await shot(page, '01-landing-diagnostico');

  /* ── Cookies + Consent Mode ─────────────────────────────────────────── */
  const banner = page.locator('[aria-label="Aviso de cookies"]');
  const hayBanner = await banner.isVisible().catch(() => false);
  check('banner-cookies-visible', hayBanner, hayBanner ? 'aparece en visita nueva' : 'NO apareció');

  const dlAntes = await readDataLayer(page);
  if (hayBanner) {
    await banner.locator('.consent-btn.primary').click();
    await page.waitForTimeout(600);
  }
  const dlTrasConsent = await readDataLayer(page);
  const consentUpdates = dlTrasConsent.filter(
    (e) => e.__gtag && e.__gtag[0] === 'consent' && e.__gtag[1] === 'update',
  );
  check(
    'gtag-consent-update',
    consentUpdates.length > 0,
    `${consentUpdates.length} update(s); dataLayer pasó de ${dlAntes.length} a ${dlTrasConsent.length} entradas`,
  );
  report.consentUpdate = consentUpdates.at(-1) ?? null;
  check(
    'banner-se-oculta',
    !(await banner.isVisible().catch(() => false)),
    'el aviso desaparece tras aceptar',
  );

  /* ── Abrir el diagnóstico ───────────────────────────────────────────── */
  const tDiag0 = Date.now();
  /* El overlay se monta entre el mousedown y el mouseup, así que el guardia
     de "hit target" de Playwright aborta su propio clic aunque este haya
     surtido efecto. Se ignora ese error: la prueba real es que `.diag-shell`
     aparezca justo después. */
  await page
    .getByRole('button', { name: /Iniciar diagnóstico/i })
    .filter({ visible: true })
    .first()
    .click({ timeout: 8_000 })
    .catch((err) => report.notas?.push?.(String(err).slice(0, 200)));
  await page.locator('.diag-shell').waitFor({ state: 'visible', timeout: 15_000 });
  await shot(page, '02-overlay-bienvenida');

  await page.getByRole('button', { name: /Descubrir mi potencial/i }).click();

  /* ── Las 19 preguntas ───────────────────────────────────────────────── */
  let estado = await waitForPhaseChange(page, null);
  let vistos = 0;

  while (estado.phase === 'question') {
    const step = estado.step;
    const field = step.fields[0];
    const respuestas = ANSWERS[step.id];
    if (!respuestas) throw new Error(`Sin respuesta prevista para ${step.id}`);
    if (step.fields.length !== 1) throw new Error(`${step.id} tiene ${step.fields.length} campos, el guion asume 1`);

    const tPaso = Date.now();

    if (field.kind === 'scale') {
      await clickExact(page, '.scale-dot', String(respuestas[0]));
    } else {
      for (const op of respuestas) await clickExact(page, '.diag-chip', op);
    }

    const instantaneo = field.kind === 'single';
    if (!instantaneo) {
      await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    }

    vistos += 1;
    report.pasos.push({
      n: vistos,
      id: step.id,
      indice: step.index,
      total: step.total,
      tipo: field.kind,
      instantaneo,
      respuesta: respuestas,
      ms: 0,
    });

    estado = await waitForPhaseChange(page, step.id);
    report.pasos.at(-1).ms = Date.now() - tPaso;

    if (vistos === 1) await shot(page, '03-primera-pregunta');
    if (vistos > 25) throw new Error('Bucle: más de 25 preguntas');
  }

  report.tiempos.cuestionario_ms = Date.now() - tDiag0;
  check('19-preguntas', vistos === 19, `se recorrieron ${vistos} pasos (esperado 19)`);
  check('fase-resultado', estado.phase === 'resultado', `fase tras la última pregunta: ${estado.phase}`);

  await page.locator('.diag-result').waitFor({ state: 'visible', timeout: 10_000 });
  await shot(page, '04-resultados');

  const impacto = estado.result?.impacto ?? null;
  report.impacto = impacto;
  check(
    'motor-scoring',
    Boolean(impacto) && impacto.modo !== 'insuficiente',
    `modo=${impacto?.modo} etiqueta="${impacto?.etiqueta ?? ''}"`,
  );

  /* ── Formulario ─────────────────────────────────────────────────────── */
  await page.getByRole('button', { name: /Conocer mis dos rutas de mejora/i }).click();
  await page.locator('.diag-form').waitFor({ state: 'visible', timeout: 10_000 });

  await page.fill('#f-name', LEAD.name);
  await page.fill('#f-clinic', LEAD.clinic);
  await page.fill('#f-wa', LEAD.whatsapp);
  await page.fill('#f-mail', LEAD.email);
  await shot(page, '05-formulario');

  /* ── Gestos reales sobre el consentimiento y el envío ────────────────
     Se prueban primero como los haría una persona (clic con hit-testing).
     Si fallan se anota el fallo y se fuerza por DOM: el objetivo de esta
     fase es auditar la tubería del lead, y quedarse aquí ocultaría si n8n,
     Sheets, Gmail y HubSpot funcionan. */
  const estaMarcado = () => page.locator('.consent input[type="checkbox"]').isChecked();

  const clicCaja = await page
    .locator('.consent .consent-box')
    .click({ timeout: 4_000 })
    .then(() => true)
    .catch(() => false);
  check(
    'consent-caja-clicable',
    clicCaja && (await estaMarcado()),
    clicCaja ? 'la caja visual responde al clic' : 'la caja del checkbox NO recibe el clic (algo la tapa)',
  );

  if (!(await estaMarcado())) {
    await page.locator('.consent .consent-text').click({ timeout: 4_000 }).catch(() => {});
  }
  if (!(await estaMarcado())) {
    await page.evaluate(() => {
      const i = document.querySelector('.consent input[type="checkbox"]');
      if (i && !i.checked) i.click();
    });
    report.notas.push('Consentimiento marcado por DOM: ningún gesto de ratón lo alcanzó.');
  }
  check('consentimiento-marcado', await estaMarcado(), `estado final del checkbox: ${await estaMarcado()}`);

  const tEnvio = Date.now();
  const clicEnvio = await page
    .getByRole('button', { name: /Recibir mi diagnóstico/i })
    .click({ timeout: 6_000 })
    .then(() => true)
    .catch(() => false);
  check(
    'boton-enviar-clicable',
    clicEnvio,
    clicEnvio ? 'el botón de envío recibe el clic' : 'el botón de envío está TAPADO: el clic no le llega',
  );
  if (!clicEnvio) {
    await page.evaluate(() => document.querySelector('.diag-form button[type="submit"]')?.click());
    report.notas.push('Envío disparado por DOM: el botón no era alcanzable con el ratón.');
  }

  await page
    .locator('.diag-ready')
    .waitFor({ state: 'visible', timeout: 40_000 });
  report.tiempos.envio_ms = Date.now() - tEnvio;

  const trasEnvio = (await readState(page))?.state;
  await shot(page, '06-pantalla-final');

  const postLead = report.webhookPosts.find((p) => p.tipo_evento === 'lead');
  if (esDemo()) {
    report.modoDemo = true;
    for (const id of ['webhook-lead-2xx', 'firma-en-payload', 'elapsed-supera-filtro', 'payload-completo']) {
      omitido(id, 'build local sin VITE_N8N_WEBHOOK_URL (modo demo, sin red)');
    }
  } else {
  check(
    'webhook-lead-2xx',
    Boolean(postLead) && postLead.status >= 200 && postLead.status < 300,
    postLead ? `HTTP ${postLead.status}, elapsed_ms=${postLead.elapsed_ms}, respuesta=${postLead.respuesta}` : 'NO se observó POST de tipo lead',
  );
  check(
    'firma-en-payload',
    Boolean(postLead?.firma_presente),
    postLead ? `firma de ${postLead.firma_len} caracteres, hp="${postLead.hp}"` : 'sin POST',
  );
  check(
    'elapsed-supera-filtro',
    (postLead?.elapsed_ms ?? 0) > 15_000,
    `elapsed_ms=${postLead?.elapsed_ms} (el filtro exige > 15000)`,
  );
  check(
    'payload-completo',
    postLead?.resultado_meta?.n_respuestas === 19,
    `respuestas_crudas=${postLead?.resultado_meta?.n_respuestas}, tipo_clinica="${postLead?.resultado_meta?.tipo_clinica}"`,
  );
  }

  const hayFallbackWa = await page
    .getByRole('link', { name: /Recibir mi diagnóstico por WhatsApp/i })
    .isVisible()
    .catch(() => false);
  check(
    'entrega-confirmada',
    trasEnvio?.deliveryPending === false && !hayFallbackWa,
    `deliveryPending=${trasEnvio?.deliveryPending}, salida WhatsApp visible=${hayFallbackWa}`,
  );

  report.tituloFinal = await page.locator('.diag-ready .diag-title').textContent();

  /* ── Solicitud de reunión ───────────────────────────────────────────── */
  await page.getByRole('button', { name: /Solicitar reunión con Carlos/i }).click();
  await page.locator('.meeting-done').waitFor({ state: 'visible', timeout: 30_000 });
  await shot(page, '07-reunion-solicitada');

  const postMeeting = report.webhookPosts.find((p) => p.tipo_evento === 'meeting');
  if (esDemo()) {
    omitido('webhook-meeting-2xx', 'build local sin webhook (modo demo)');
  } else {
    check(
      'webhook-meeting-2xx',
      Boolean(postMeeting) && postMeeting.status >= 200 && postMeeting.status < 300,
      postMeeting ? `HTTP ${postMeeting.status}, elapsed_ms=${postMeeting.elapsed_ms}` : 'NO se observó POST de tipo meeting',
    );
  }

  /* ── GA4 ────────────────────────────────────────────────────────────── */
  const dl = await readDataLayer(page);
  report.dataLayer = dl;
  const eventos = dl.map((e) => e.event).filter(Boolean);
  report.eventosGA4 = eventos;
  for (const ev of [
    'diagnostic_opened',
    'diagnostic_start',
    'diagnostic_complete',
    'generate_lead',
    'schedule_call_click',
  ]) {
    check(`ga4:${ev}`, eventos.includes(ev), eventos.includes(ev) ? 'presente en dataLayer' : 'AUSENTE');
  }
  const hitsGA = report.red.filter((r) => /google-analytics\.com|analytics\.google\.com/.test(r.url));
  report.hitsGA4 = hitsGA.length;
  /* Los eventos del dataLayer (arriba) son la prueba de que la capa de
     analítica funciona; los hits de red requieren además `VITE_GA4_ID`,
     que solo existe en el despliegue. */
  const sinGA4 = hitsGA.length === 0 && /localhost|127\.0\.0\.1/.test(SITE);
  if (sinGA4) omitido('ga4-hits-red', 'build local sin VITE_GA4_ID (la etiqueta no se carga)');
  else check('ga4-hits-red', hitsGA.length > 0, `${hitsGA.length} peticiones a Google Analytics`);

  report.tiempos.total_ms = Date.now() - t0;
}

/* ── Landing (conecta) ───────────────────────────────────────────────────── */

async function correrLanding(page) {
  const t0 = Date.now();
  await page.goto(LANDING, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

  const vp = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScroll: document.body.scrollWidth,
  }));
  report.viewport = vp;
  check(
    'landing-sin-overflow',
    vp.scrollWidth <= vp.innerWidth + 1 && vp.bodyScroll <= vp.innerWidth + 1,
    `scrollWidth=${vp.scrollWidth}, body=${vp.bodyScroll}, innerWidth=${vp.innerWidth}`,
  );
  await shot(page, '01-landing');

  const banner = page.locator('[aria-label="Aviso de cookies"]');
  const hayBanner = await banner.isVisible().catch(() => false);
  check('landing-banner-cookies', hayBanner, hayBanner ? 'visible' : 'NO apareció');
  if (hayBanner) {
    await banner.locator('.consent-btn.primary').click();
    await page.waitForTimeout(500);
    check(
      'landing-banner-se-oculta',
      !(await banner.isVisible().catch(() => false)),
      'desaparece tras aceptar',
    );
    const dl = await readDataLayer(page);
    check(
      'landing-gtag-consent-update',
      dl.some((e) => e.__gtag && e.__gtag[0] === 'consent' && e.__gtag[1] === 'update'),
      'consent update emitido',
    );
  }

  const cta = page.getByRole('button', { name: /Diseñar mi sistema de crecimiento/i }).filter({ visible: true }).first();
  const hayCta = await cta.count();
  check('landing-cta-presente', hayCta > 0, `${hayCta} CTA(s) "Diseñar mi sistema de crecimiento"`);
  if (hayCta > 0) {
    await cta.click({ timeout: 8_000 }).catch((err) => report.notas.push(String(err).slice(0, 200)));
    const abierto = await page
      .locator('.diag-shell')
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    check('landing-cta-abre-diagnostico', abierto, abierto ? 'overlay .diag-shell visible' : 'no abrió');
    if (abierto) {
      await shot(page, '02-diagnostico-abierto');
      const titulo = await page.locator('.diag-panel .diag-title').first().textContent().catch(() => null);
      check('landing-bienvenida', Boolean(titulo), `título: "${titulo}"`);
    }
  }

  const errs = report.errores.filter((e) => e.origen !== 'requestfailed');
  check('landing-sin-errores-consola', errs.length === 0, errs.length ? JSON.stringify(errs).slice(0, 400) : 'consola limpia');

  report.tiempos.total_ms = Date.now() - t0;
}

/* ── Arranque ────────────────────────────────────────────────────────────── */

const viewports = {
  desktop: { width: 1440, height: 900, isMobile: false },
  mobile: { width: 375, height: 812, isMobile: true, deviceScaleFactor: 3 },
  landing: { width: 1440, height: 900, isMobile: false },
};

const perfil = viewports[PROFILE];
if (!perfil) {
  console.error(`Perfil desconocido: ${PROFILE}. Usa desktop | mobile | landing`);
  process.exit(2);
}

await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: perfil.width, height: perfil.height },
  deviceScaleFactor: perfil.deviceScaleFactor ?? 1,
  isMobile: perfil.isMobile,
  hasTouch: perfil.isMobile,
  locale: 'es-MX',
  timezoneId: 'America/Mexico_City',
  userAgent: perfil.isMobile
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    : undefined,
});

const page = await context.newPage();
instrument(page);

let fallo = null;
try {
  if (PROFILE === 'landing') await correrLanding(page);
  else await correrDiagnostico(page);
} catch (err) {
  fallo = String(err?.stack ?? err);
  console.error('\n💥 La auditoría se detuvo:', fallo);
  await shot(page, '99-fallo').catch(() => {});
}

report.fallo = fallo;
report.terminado = new Date().toISOString();

/* Los errores de consola se evalúan al final para incluir los del recorrido. */
const erroresReales = report.errores.filter((e) => e.origen !== 'requestfailed');
check('sin-errores-js', erroresReales.length === 0, erroresReales.length ? JSON.stringify(erroresReales).slice(0, 600) : 'consola sin errores');

const fallidos = report.checks.filter((c) => !c.ok);
report.resumen = { total: report.checks.length, ok: report.checks.length - fallidos.length, fallidos: fallidos.length };

await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

console.log(`\n── ${PROFILE} ──`);
console.log(`Checks: ${report.resumen.ok}/${report.resumen.total}`);
console.log(`Correo de prueba: ${LEAD.email}`);
console.log(`Tiempos: ${JSON.stringify(report.tiempos)}`);
console.log(`Reporte: ${path.relative(ROOT, path.join(OUT, 'report.json'))}`);

await context.close();
await browser.close();
process.exit(fallo || fallidos.length ? 1 : 0);
