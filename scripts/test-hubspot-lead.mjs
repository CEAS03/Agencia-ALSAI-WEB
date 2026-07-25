/**
 * Prueba de la función api/hubspot-lead sin tocar HubSpot.
 * Sustituye `fetch` por un doble que registra las peticiones y devuelve
 * respuestas simuladas, para comprobar que se construyen bien los payloads.
 */
process.env.HUBSPOT_TOKEN = 'pat-na1-FALSO-PARA-PRUEBAS';
process.env.ALLOWED_ORIGIN = 'https://www.agencia-alsai.com';

const RUTA = new URL('../api/hubspot-lead.ts', import.meta.url).href;

let llamadas = [];
let contactoExiste = false;

globalThis.fetch = async (url, init = {}) => {
  const path = String(url).replace('https://api.hubapi.com', '');
  const body = init.body ? JSON.parse(init.body) : null;
  llamadas.push({ metodo: init.method ?? 'GET', path, body });

  const json = (o, ok = true) => ({
    ok, status: ok ? 200 : 400, text: async () => JSON.stringify(o),
  });

  if (path.startsWith('/crm/v3/objects/contacts/search')) {
    return json({ results: contactoExiste ? [{ id: '555' }] : [] });
  }
  if (path.startsWith('/crm/v3/objects/companies/search')) return json({ results: [] });
  if (path.startsWith('/crm/v3/pipelines/deals')) {
    return json({ results: [{ id: 'default', stages: [
      { id: 'etapa-2', displayOrder: 1 }, { id: 'etapa-1', displayOrder: 0 },
    ] }] });
  }
  if (path.startsWith('/crm/v3/objects/contacts')) return json({ id: '111' });
  if (path.startsWith('/crm/v3/objects/companies')) return json({ id: '222' });
  if (path.startsWith('/crm/v3/objects/deals')) return json({ id: '333' });
  if (path.startsWith('/crm/v3/objects/notes')) return json({ id: '444' });
  if (path.startsWith('/crm/v4/objects')) return json({});
  return json({});
};

const { default: handler } = await import(RUTA);

function resDoble() {
  const out = { code: null, body: null, headers: {} };
  return {
    out,
    status(c) { out.code = c; return this; },
    json(b) { out.body = b; },
    setHeader(k, v) { out.headers[k] = v; },
    end() {},
  };
}

const PAYLOAD = {
  type: 'lead',
  sessionId: 'web-123-abc',
  source: 'sitio-web',
  lead: {
    name: 'María Fernanda López',
    clinic: 'Clínica Dental Sonrisa',
    whatsapp: '4421234567',
    email: 'MARIA@clinica.com',
    consent: true,
  },
  respuestasTexto: '1. ¿Qué tipo de clínica es?\n   Dental',
  resultado: {
    etapas: {
      captacion: { color: 'verde', conclusion: 'Llegan pacientes suficientes.' },
      respuesta: { color: 'rojo', conclusion: 'Fuera de horario nadie contesta.' },
      agenda: { color: 'amarillo', conclusion: 'Agenda manual.' },
      asistencia: { color: 'rojo', conclusion: 'Ausentismo alto.' },
      conversion: { color: 'gris', conclusion: 'Sin datos.' },
      recuperacion: { color: 'rojo', conclusion: 'No hay reactivación.' },
    },
    impacto: {
      modo: 'pesos', dinero_min: 18000, dinero_max: 42000,
      etiqueta: 'Entre $18,000 y $42,000 al mes',
      nota_total: 'Suma de las palancas A y B.',
      supuestos_aplicados: ['70% de las citas son valoraciones'],
    },
    plan: {
      temperatura: 'alta',
      motivo_temperatura: '3 de 6 etapas en rojo · fuga recuperable desde $18,000 MXN al mes',
      recomendaciones: [
        {
          modulo: 'atencion', nombre: 'Atención inteligente', prioridad: 1,
          motivo: 'Fuera de horario nadie contesta.',
          evidencia: ['P08 · Respuesta fuera de horario: No lo medimos'],
        },
        {
          modulo: 'agenda', nombre: 'Agenda, seguimiento y recuperación', prioridad: 1,
          motivo: 'Ausentismo alto y base dormida.',
          evidencia: ['P12 · De cada 10 citas se pierden: 5'],
        },
      ],
    },
    meta: {
      tipo_clinica: 'Dental', infraestructura: 'Agenda física',
      objetivo_90d: ['Más citas', 'Menos ausencias'],
      /* Respuestas crudas reales: son la fuente de las 19 propiedades.
         q6 lleva un ';' a propósito y q9 una salida de escala. */
      respuestas_crudas: {
        'q1-tipo': { tipo: 'Clínica dental' },
        'q4-origen': { origen: ['Google o Google Maps', 'Anuncios pagados'] },
        'q6-publicidad': { inversion: 'No invertimos; los pacientes llegan por recomendación u otros medios orgánicos' },
        'q9-conversion-citas': { conversion: 'No lo sabemos' },
        'q12-ausencias': { ausencias: 5 },
        'q18-sistemas': { sistemas: 'Utilizamos una agenda física o registros manuales' },
        'q19-prioridad': { prioridad: ['Reducir cancelaciones y ausencias'] },
      },
    },
  },
  planTexto: 'Prioridad del lead: ALTA\n\n1. Atención inteligente — Urgente',
  elapsed_ms: 372_000,
};

const req = (body, origin = 'https://www.agencia-alsai.com', method = 'POST') =>
  ({ method, body, headers: { origin } });

let fallos = 0;
const check = (nombre, cond, extra = '') => {
  console.log(`  ${cond ? '✔' : '✘'} ${nombre}${cond ? '' : '  ← ' + extra}`);
  if (!cond) fallos++;
};

// ── 1. Alta completa ────────────────────────────────────────────────────
console.log('\n1. Lead nuevo con clínica y resultado');
llamadas = []; contactoExiste = false;
let r = resDoble();
await handler(req(PAYLOAD), r);

const post = (p) => llamadas.find((l) => l.path.startsWith(p) && l.metodo === 'POST');
const contacto = post('/crm/v3/objects/contacts') && !llamadas.find(l => l.path.includes('search') && l.path.includes('contacts') && l.metodo === 'POST' && l.body?.properties);
const creaContacto = llamadas.find((l) => l.path === '/crm/v3/objects/contacts' && l.metodo === 'POST');
const creaEmpresa = llamadas.find((l) => l.path === '/crm/v3/objects/companies' && l.metodo === 'POST');
const creaNegocio = llamadas.find((l) => l.path === '/crm/v3/objects/deals' && l.metodo === 'POST');
const creaNota = llamadas.find((l) => l.path === '/crm/v3/objects/notes' && l.metodo === 'POST');
const asociacion = llamadas.find((l) => l.path.startsWith('/crm/v4/objects/contacts'));

check('responde 200', r.out.code === 200, JSON.stringify(r.out));
check('crea el contacto', !!creaContacto);
check('crea la empresa', !!creaEmpresa);
check('asocia contacto→empresa', !!asociacion);
check('crea el negocio', !!creaNegocio);
check('crea la nota', !!creaNota);

const p = creaContacto?.body?.properties ?? {};
check('nombre separado', p.firstname === 'María' && p.lastname === 'Fernanda López', JSON.stringify([p.firstname, p.lastname]));
check('email en minúsculas', p.email === 'maria@clinica.com', p.email);
check('teléfono normalizado a +52', p.phone === '+524421234567', p.phone);
check('clínica en company', p.company === 'Clínica Dental Sonrisa', p.company);
check('impacto min/max', p.alsai_diag_impacto_min === '18000' && p.alsai_diag_impacto_max === '42000');
check('cuenta 3 etapas en rojo', p.alsai_diag_etapas_rojas === '3', p.alsai_diag_etapas_rojas);
check('color por etapa', p.alsai_diag_etapa_respuesta === 'rojo' && p.alsai_diag_etapa_conversion === 'gris');
check('consentimiento', p.alsai_diag_consentimiento === 'true');
check('guarda la transcripción', (p.alsai_diag_respuestas ?? '').includes('¿Qué tipo de clínica es?'));

check('guarda el plan de soluciones', (p.alsai_diag_plan ?? '').includes('Prioridad del lead'));
check('temperatura del lead', p.alsai_diag_temperatura === 'alta', p.alsai_diag_temperatura);
check('solución prioritaria = la primera del plan', p.alsai_diag_solucion_1 === 'atencion', p.alsai_diag_solucion_1);
check('lista todas las soluciones', (p.alsai_diag_soluciones ?? '').includes('Atención inteligente') && (p.alsai_diag_soluciones ?? '').includes('Agenda'));
check('cuenta 1 etapa en amarillo', p.alsai_diag_etapas_amarillas === '1', p.alsai_diag_etapas_amarillas);
check('origen normalizado', p.alsai_diag_origen === 'sitio-web', p.alsai_diag_origen);
check('duración en minutos', p.alsai_diag_duracion_min === '6.2', p.alsai_diag_duracion_min);

// ── 1b. Las 19 respuestas, en su propia escritura ───────────────────────
console.log('\n1b. Las respuestas como propiedades');
const patchRespuestas = llamadas.find(
  (l) => l.metodo === 'PATCH' && l.path === '/crm/v3/objects/contacts/111',
);
const pr = patchRespuestas?.body?.properties ?? {};

check('se escriben aparte del contacto', !!patchRespuestas);
check('no viajan en el alta del contacto', p.alsai_p01_tipo_clinica === undefined);
check('opción única literal', pr.alsai_p01_tipo_clinica === 'Clínica dental', pr.alsai_p01_tipo_clinica);
check('opción múltiple separada por ;',
  pr.alsai_p04_canales_descubrimiento === 'Google o Google Maps;Anuncios pagados',
  pr.alsai_p04_canales_descubrimiento);
check('el ; dentro de un valor se convierte en ,',
  pr.alsai_p06_inversion_publicidad === 'No invertimos, los pacientes llegan por recomendación u otros medios orgánicos',
  pr.alsai_p06_inversion_publicidad);
check('escala numérica se guarda como número', pr.alsai_p12_ausencias_de_10 === '5', pr.alsai_p12_ausencias_de_10);
check('escala con salida queda vacía', pr.alsai_p09_agendan_de_10 === undefined, pr.alsai_p09_agendan_de_10);
check('pregunta no contestada se omite', pr.alsai_p11_citas_mes === undefined);
check('multi de una sola opción', pr.alsai_p19_objetivo_90d === 'Reducir cancelaciones y ausencias', pr.alsai_p19_objetivo_90d);

check('negocio usa la etapa de menor displayOrder',
  creaNegocio?.body?.properties?.dealstage === 'etapa-1', creaNegocio?.body?.properties?.dealstage);
check('negocio lleva el importe conservador',
  creaNegocio?.body?.properties?.amount === '18000', creaNegocio?.body?.properties?.amount);
check('nota asociada a contacto, empresa y negocio',
  (creaNota?.body?.associations ?? []).length === 3, String((creaNota?.body?.associations ?? []).length));
check('la nota incluye el impacto',
  (creaNota?.body?.properties?.hs_note_body ?? '').includes('$18,000'));

// ── 2. Contacto ya existente → PATCH ────────────────────────────────────
console.log('\n2. Contacto que ya existía');
llamadas = []; contactoExiste = true;
r = resDoble();
await handler(req(PAYLOAD), r);
const patch = llamadas.find((l) => l.metodo === 'PATCH' && l.path.includes('/contacts/555'));
check('actualiza en vez de duplicar', !!patch);
check('no crea contacto nuevo', !llamadas.find((l) => l.path === '/crm/v3/objects/contacts' && l.metodo === 'POST'));

// ── 3. Validaciones ─────────────────────────────────────────────────────
console.log('\n3. Validaciones y seguridad');
llamadas = []; contactoExiste = false;

r = resDoble();
await handler(req({ ...PAYLOAD, lead: { name: '', email: '', whatsapp: '' } }), r);
check('rechaza lead sin datos (400)', r.out.code === 400, String(r.out.code));

r = resDoble();
await handler(req(PAYLOAD, 'https://sitio-malicioso.com'), r);
check('rechaza origen ajeno (403)', r.out.code === 403, String(r.out.code));

r = resDoble();
await handler(req(PAYLOAD, 'https://www.agencia-alsai.com', 'GET'), r);
check('rechaza método GET (405)', r.out.code === 405, String(r.out.code));

r = resDoble();
await handler(req(PAYLOAD, 'http://localhost:5188'), r);
check('permite localhost para pruebas', r.out.code === 200, String(r.out.code));

// ── 4. Solicitud de reunión ─────────────────────────────────────────────
console.log('\n4. Solicitud de reunión');
llamadas = []; contactoExiste = true;
r = resDoble();
await handler(req({ type: 'meeting', lead: PAYLOAD.lead }), r);
check('responde 200', r.out.code === 200);
check('solo deja una nota', llamadas.filter((l) => l.path === '/crm/v3/objects/notes' && l.metodo === 'POST').length === 1);
check('no crea negocio', !llamadas.find((l) => l.path === '/crm/v3/objects/deals'));

// ── 5. Sin token configurado ────────────────────────────────────────────
console.log('\n5. Sin datos suficientes de impacto (modo volumen)');
llamadas = []; contactoExiste = false;
r = resDoble();
await handler(req({
  ...PAYLOAD,
  resultado: { ...PAYLOAD.resultado, impacto: { modo: 'volumen', volumen_min: 8, volumen_max: 15, etiqueta: 'Entre 8 y 15 citas' } },
}), r);
const c2 = llamadas.find((l) => l.path === '/crm/v3/objects/contacts' && l.metodo === 'POST');
const d2 = llamadas.find((l) => l.path === '/crm/v3/objects/deals' && l.metodo === 'POST');
check('guarda el rango de volumen', c2?.body?.properties?.alsai_diag_impacto_min === '8');
check('el negocio NO lleva importe en modo volumen', d2?.body?.properties?.amount === undefined, JSON.stringify(d2?.body?.properties));

console.log(fallos === 0 ? '\n✅ Todas las comprobaciones pasaron.' : `\n❌ ${fallos} comprobaciones fallaron.`);
process.exit(fallos === 0 ? 0 : 1);
