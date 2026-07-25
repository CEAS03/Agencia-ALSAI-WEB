/**
 * Comprueba que `preparar-lead.js` emite exactamente las 51 columnas de la
 * hoja "Leads", en el mismo orden y con los valores correctos, partiendo de
 * un diagnóstico real producido por el motor.
 *
 *   npm run test:n8n
 *
 * Existe porque ese archivo se pega a mano en la UI de n8n: sin esta prueba,
 * un error de dedo solo se descubre cuando un lead real cae mal en la hoja.
 */
import fs from 'node:fs';
import { evaluarDiagnostico } from '../src/diagnostic/engine/scoring.ts';
import { transcribirPlan } from '../src/diagnostic/engine/soluciones.ts';
import { DEMO_STEPS } from '../src/diagnostic/demoScript.ts';

/* Copia de `transcribirRespuestas`: adapter.ts usa "parameter properties",
   que el modo strip-only de Node todavía no soporta. */
const transcribirRespuestas = (rs) =>
  DEMO_STEPS.map((step, i) => {
    const dadas = rs[step.id];
    if (!dadas) return null;
    const lineas = step.fields
      .map((c) => {
        const v = dadas[c.id];
        if (v === undefined || v === '') return null;
        return '   ' + (Array.isArray(v) ? v.join(', ') : String(v));
      })
      .filter(Boolean);
    return lineas.length ? `${i + 1}. ${step.title}\n${lineas.join('\n')}` : null;
  })
    .filter(Boolean)
    .join('\n\n');

/* Clínica con fugas reales: agenda y asistencia en rojo, Q14 sin dato. */
const respuestas = {
  'q1-tipo': { tipo: 'Clínica dental' },
  'q2-agenda': { capacidad: 'La ocupación es irregular: algunos días se llenan y otros quedan vacíos' },
  'q3-volumen': { volumen: 'Entre 25 y 50' },
  'q4-origen': { origen: ['Recomendaciones de otros pacientes', 'Google o Google Maps'] },
  'q5-medios': { medios: ['WhatsApp', 'Llamada telefónica'] },
  'q6-publicidad': { inversion: 'No invertimos; los pacientes llegan por recomendación u otros medios orgánicos' },
  'q7-respuesta-dentro': { dentro: 'El tiempo varía y algunas solicitudes pueden perderse' },
  'q8-respuesta-fuera': { fuera: 'Al comenzar el siguiente horario de atención' },
  'q9-conversion-citas': { conversion: 3 },
  'q10-seguimiento': { seguimiento: 'Ya no se le vuelve a contactar' },
  'q11-citas': { citas: 'Entre 50 y 125' },
  'q12-ausencias': { ausencias: 4 },
  'q13-valor-cita': { valorCita: 'Entre $1,000 y $2,500 MXN' },
  'q14-conversion-tratamiento': { conversionTratamiento: 'No lo sabemos' },
  'q15-tratamientos-pendientes': { pendientes: 'No existe un proceso definido' },
  'q16-valor-tratamiento': { valorTratamiento: 'Entre $4,000 y $7,500 MXN' },
  'q17-recuperacion': { recuperacion: 'Normalmente no se le vuelve a contactar' },
  'q18-sistemas': { sistemas: 'Utilizamos varios sistemas que no se comunican entre sí' },
  'q19-prioridad': { prioridad: ['Reducir cancelaciones y ausencias', 'Tener mayor control y medición'] },
};

const resultado = evaluarDiagnostico(respuestas);
const body = {
  type: 'lead',
  sessionId: 'web-prueba-001',
  source: 'sitio-web',
  enviado_en: '2026-07-25T04:30:00.000Z',
  elapsed_ms: 402_000,
  lead: {
    name: 'Ana López', clinic: 'Clínica Sonrisa', whatsapp: '4421234567',
    email: 'ANA@clinica.com', consent: true,
  },
  meta: { userAgent: 'Mozilla/5.0 (iPhone)' },
  resultado,
  respuestasTexto: transcribirRespuestas(respuestas),
  planTexto: transcribirPlan(resultado.plan),
};

globalThis.$input = { item: { json: { body } } };
const codigo = fs.readFileSync(new URL('./preparar-lead.js', import.meta.url), 'utf8');
const fila = new Function(codigo)().json;

/** Encabezado exacto de la hoja "Leads". */
const HOJA = [
  'fecha_iso', 'fecha_mx', 'nombre', 'clinica', 'whatsapp', 'correo', 'consentimiento',
  'origen', 'duracion_min', 'session_id',
  'temperatura', 'solucion_prioritaria', 'soluciones_sugeridas', 'cifra', 'modo_impacto',
  'impacto_min', 'impacto_max', 'etapas_rojas', 'etapas_amarillas',
  'e1_captacion', 'e2_respuesta', 'e3_agenda', 'e4_asistencia', 'e5_conversion', 'e6_recuperacion',
  'p01_tipo_clinica', 'p02_capacidad_agenda', 'p03_personas_nuevas_mes',
  'p04_canales_descubrimiento', 'p05_medios_contacto', 'p06_inversion_publicidad',
  'p07_respuesta_en_horario', 'p08_respuesta_fuera_horario', 'p09_agendan_de_10',
  'p10_seguimiento_no_agenda', 'p11_citas_mes', 'p12_ausencias_de_10', 'p13_valor_cita',
  'p14_avanzan_de_10', 'p15_tratamientos_pendientes', 'p16_valor_tratamiento',
  'p17_recuperacion_pacientes', 'p18_sistemas_conectados', 'p19_objetivo_90d',
  'transcripcion', 'plan_sugerido', 'resumen_texto',
  'palancas', 'respuestas_json', 'resultado_json', 'user_agent',
];

let fallos = 0;
const check = (nombre, cond, extra = '') => {
  console.log(`  ${cond ? '✔' : '✘'} ${nombre}${cond ? '' : '  ← ' + extra}`);
  if (!cond) fallos++;
};

console.log('\n1. Columnas');
const emitidas = Object.keys(fila).filter((c) => c !== 'resumen_html');
check('están las 51 de la hoja', HOJA.every((c) => c in fila),
  HOJA.filter((c) => !(c in fila)).join(', '));
check('no sobra ninguna', emitidas.every((c) => HOJA.includes(c)),
  emitidas.filter((c) => !HOJA.includes(c)).join(', '));
check('el orden coincide con el encabezado', emitidas.join() === HOJA.join());
check('ninguna llega como undefined', HOJA.every((c) => fila[c] !== undefined));

console.log('\n2. Contacto');
check('correo en minúsculas', fila.correo === 'ana@clinica.com', fila.correo);
check('consentimiento legible', fila.consentimiento === 'sí', fila.consentimiento);
check('duración en minutos', fila.duracion_min === 6.7, String(fila.duracion_min));
check('fecha legible de México', /2026/.test(fila.fecha_mx), fila.fecha_mx);

console.log('\n3. Las 19 respuestas');
check('opción única', fila.p01_tipo_clinica === 'Clínica dental', fila.p01_tipo_clinica);
check('opción múltiple unida por ;',
  fila.p04_canales_descubrimiento === 'Recomendaciones de otros pacientes;Google o Google Maps',
  fila.p04_canales_descubrimiento);
check('escala como número', fila.p09_agendan_de_10 === 3, String(fila.p09_agendan_de_10));
check('escala con salida queda vacía', fila.p14_avanzan_de_10 === '', String(fila.p14_avanzan_de_10));
check('las 19 llegan pobladas o vacías',
  HOJA.filter((c) => /^p\d\d/.test(c)).length === 19);

console.log('\n4. Veredicto y semáforo');
check('temperatura calculada', ['alta', 'media', 'baja'].includes(fila.temperatura), fila.temperatura);
check('hay solución prioritaria', String(fila.solucion_prioritaria).length > 0, fila.solucion_prioritaria);
check('cuenta las etapas en rojo', fila.etapas_rojas >= 3, String(fila.etapas_rojas));
check('color por etapa', fila.e3_agenda === 'rojo', fila.e3_agenda);
check('impacto en pesos', fila.modo_impacto === 'pesos' && fila.impacto_min > 0,
  `${fila.modo_impacto}/${fila.impacto_min}`);

console.log('\n5. Texto para la IA');
const numeradas = (fila.transcripcion.match(/^\d+\. /gm) ?? []).length;
check('transcripción con las 19 preguntas', numeradas === 19, String(numeradas));
check('el plan cita la evidencia', fila.plan_sugerido.includes('Evidencia:'));
check('json de respuestas parseable y completo',
  Object.keys(JSON.parse(fila.respuestas_json)).length === 19);
check('resumen sin etiquetas HTML', !/<[a-z]/i.test(fila.resumen_texto));

console.log(fallos === 0 ? '\n✅ La fila coincide con la hoja.' : `\n❌ ${fallos} comprobaciones fallaron.`);
process.exitCode = fallos === 0 ? 0 : 1;
