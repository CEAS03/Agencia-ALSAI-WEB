/**
 * ─────────────────────────────────────────────────────────────────────────
 *  VERIFICACIÓN DE LOS DOS ARREGLOS — contra la build local (`npm run
 *  preview`), sin enviar ningún lead.
 *
 *    1. Colisión `.consent`: la casilla de consentimiento del formulario ya
 *       no hereda el `position: fixed` del aviso de cookies, y tanto ella
 *       como el botón de envío reciben el clic.
 *    2. Hidratación: las rutas prerenderizadas ya no lanzan React #418/#423
 *       (mismatch) porque el chunk de la página actual se resuelve antes de
 *       hidratar.
 *
 *    node scripts/qa-verify-fixes.mjs [baseUrl]
 * ─────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4188';

/* Snapshot que aterriza directo en el formulario: la fase 'lead' es la
   única donde vive la casilla de consentimiento. */
const SNAP = {
  state: {
    phase: 'lead', step: null, progress: 1, lastAnswer: null, analysisNote: '',
    lead: null, deliveryPending: false, meeting: 'idle', answers: {}, result: null,
  },
  demoIndex: 999,
};

const checks = [];
const check = (id, ok, detalle) => {
  checks.push({ id, ok, detalle });
  console.log(`${ok ? '✅' : '❌'} ${id} — ${detalle}`);
};

const browser = await chromium.launch({ headless: true });

/* ── 1. Hidratación en cada ruta prerenderizada ──────────────────────────── */

const RUTAS = ['/', '/diagnostico', '/clinicas', '/soluciones', '/casos', '/nosotros', '/aviso-de-privacidad'];

for (const ruta of RUTAS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-MX' });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(String(e)));

  await page.goto(`${BASE}${ruta}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const hidratacion = errores.filter((e) => /#418|#423|#425|hydrat/i.test(e));
  /* El contenido tiene que seguir en pie tras hidratar. */
  const tieneMain = await page.locator('main').count();

  check(
    `hidratacion${ruta}`,
    hidratacion.length === 0 && tieneMain > 0,
    hidratacion.length === 0
      ? `sin mismatch; <main> presente (${tieneMain})`
      : `${hidratacion.length} error(es): ${hidratacion[0].slice(0, 120)}`,
  );

  await ctx.close();
}

/* ── 2. Colisión .consent en el formulario ───────────────────────────────── */

for (const [perfil, w, h] of [['escritorio', 1440, 900], ['movil', 375, 812]]) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    locale: 'es-MX',
    isMobile: perfil === 'movil',
    hasTouch: perfil === 'movil',
  });
  const page = await ctx.newPage();
  await page.addInitScript((s) => {
    sessionStorage.setItem('alsai.diagnostic.v2', JSON.stringify(s));
    /* Se deja el aviso de cookies SIN decidir: así ambos elementos —el
       banner y la casilla del formulario— conviven en pantalla, que es
       justo el escenario donde la colisión se manifestaba. */
  }, SNAP);

  await page.goto(`${BASE}/diagnostico`, { waitUntil: 'domcontentloaded' });
  await page.locator('.diag-form').waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(1200);

  const medidas = await page.evaluate(() => {
    const label = document.querySelector('label.consent');
    const btn = document.querySelector('.diag-form button[type="submit"]');
    const banner = document.querySelector('.cookie-consent');
    const cs = getComputedStyle(label);
    const solapan = (() => {
      const a = label.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
    })();
    return {
      position: cs.position,
      zIndex: cs.zIndex,
      solapan,
      bannerPresente: Boolean(banner),
      bannerPosition: banner ? getComputedStyle(banner).position : null,
    };
  });

  check(
    `consent-no-fixed:${perfil}`,
    medidas.position === 'static',
    `label.consent → position: ${medidas.position} (z-index ${medidas.zIndex})`,
  );
  check(
    `consent-no-tapa-boton:${perfil}`,
    !medidas.solapan,
    medidas.solapan ? 'la casilla SIGUE solapando el botón de envío' : 'la casilla ya no solapa el botón',
  );
  check(
    `banner-cookies-intacto:${perfil}`,
    medidas.bannerPresente && medidas.bannerPosition === 'fixed',
    `.cookie-consent presente=${medidas.bannerPresente}, position=${medidas.bannerPosition}`,
  );

  /* El aviso flota sobre el overlay: tiene que seguir siendo accionable
     dentro del diagnóstico, o quien entre por /diagnostico —que lo abre
     solo— nunca podría decidir sobre las cookies. */
  const avisoAccionable = await page
    .locator('[aria-label="Aviso de cookies"] .consent-btn.primary')
    .click({ timeout: 5_000, trial: true })
    .then(() => true)
    .catch(() => false);
  check(
    `aviso-cookies-accionable:${perfil}`,
    avisoAccionable,
    avisoAccionable ? 'el botón "Aceptar" recibe el clic con el diagnóstico abierto' : 'el aviso quedó inalcanzable',
  );

  /* Gestos reales, sin `force`: si el hit-testing falla, el clic falla.
     El aviso de cookies sigue en pantalla a propósito — es el escenario
     que rompía el envío. */
  await page.locator('.consent .consent-box').scrollIntoViewIfNeeded().catch(() => {});
  const marcado = await page
    .locator('.consent .consent-box')
    .click({ timeout: 5_000 })
    .then(() => page.locator('.consent input[type="checkbox"]').isChecked())
    .catch(() => 'timeout');
  check(`casilla-clicable:${perfil}`, marcado === true, `resultado del clic real: ${marcado}`);

  /* El botón debe recibir el clic. Con el formulario vacío no envía nada:
     la validación lo detiene y pinta los errores de campo — que es
     precisamente la señal de que el clic llegó. */
  await page
    .getByRole('button', { name: /Recibir mi diagnóstico/i })
    .scrollIntoViewIfNeeded()
    .catch(() => {});
  const enviado = await page
    .getByRole('button', { name: /Recibir mi diagnóstico/i })
    .click({ timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  const errsCampo = await page.locator('.field-error').count();
  check(
    `boton-envio-clicable:${perfil}`,
    enviado && errsCampo > 0,
    enviado ? `clic recibido; la validación pintó ${errsCampo} error(es) de campo` : 'el botón sigue TAPADO',
  );

  await page.screenshot({ path: `qa-out/fix-${perfil}.png` });
  await ctx.close();
}

await browser.close();

const fallidos = checks.filter((c) => !c.ok);
console.log(`\nChecks: ${checks.length - fallidos.length}/${checks.length}`);
process.exit(fallidos.length ? 1 : 0);
