import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluarDiagnostico, type RespuestasCrudas } from './scoring.ts';
import { transcribirPlan, type ModuloKey } from './soluciones.ts';

/**
 * Casos del motor de soluciones (npm test).
 *
 * La regla que protegen todos: ningún módulo aparece sin una respuesta
 * concreta que lo justifique, y el orden refleja urgencia real.
 */

/** Clínica sana de referencia; cada caso rompe solo lo que quiere probar. */
function base(overrides: RespuestasCrudas = {}): RespuestasCrudas {
  return {
    'q1-tipo': { tipo: 'Clínica dental' },
    'q2-agenda': { capacidad: 'Trabajamos cerca de nuestra capacidad máxima' },
    'q3-volumen': { volumen: 'Entre 25 y 50' },
    'q4-origen': { origen: ['Recomendaciones de otros pacientes', 'Sitio web o búsquedas orgánicas'] },
    'q5-medios': { medios: ['WhatsApp', 'Formulario o chat del sitio web'] },
    'q6-publicidad': { inversion: 'Entre $5,000 y $20,000 MXN al mes' },
    'q7-respuesta-dentro': { dentro: 'Menos de 5 minutos' },
    'q8-respuesta-fuera': { fuera: 'En minutos, aunque sea fuera del horario' },
    'q9-conversion-citas': { conversion: 8 },
    'q10-seguimiento': { seguimiento: 'Entra en un proceso registrado con seguimiento automático y atención humana' },
    'q11-citas': { citas: 'Entre 50 y 125' },
    'q12-ausencias': { ausencias: 1 },
    'q13-valor-cita': { valorCita: 'Entre $1,000 y $2,500 MXN' },
    'q14-conversion-tratamiento': { conversionTratamiento: 8 },
    'q15-tratamientos-pendientes': { pendientes: 'Queda registrado con etapa, responsable, próxima acción y seguimiento estructurado' },
    'q16-valor-tratamiento': { valorTratamiento: 'Entre $4,000 y $7,500 MXN' },
    'q17-recuperacion': { recuperacion: 'Se detecta automáticamente y recibe comunicación según su tratamiento' },
    'q18-sistemas': { sistemas: 'Todo está conectado y actualizado en un mismo sistema' },
    'q19-prioridad': { prioridad: ['Convertir más solicitudes en citas'] },
    ...overrides,
  };
}

const modulos = (r: ReturnType<typeof evaluarDiagnostico>): ModuloKey[] =>
  r.plan.recomendaciones.map((x) => x.modulo);

test('Clínica sana y conectada → no se le inventa ningún módulo', () => {
  const r = evaluarDiagnostico(base());
  assert.deepEqual(modulos(r), []);
  assert.equal(r.plan.temperatura, 'media'); // hay fuga en pesos, pero sin etapas rojas
});

test('Respuesta lenta dentro y fuera de horario → Atención inteligente, urgente', () => {
  const r = evaluarDiagnostico(
    base({
      'q7-respuesta-dentro': { dentro: 'El tiempo varía y algunas solicitudes pueden perderse' },
      'q8-respuesta-fuera': { fuera: 'Depende; algunas solicitudes pueden perderse' },
    }),
  );

  const atencion = r.plan.recomendaciones.find((x) => x.modulo === 'atencion');
  assert.ok(atencion, 'debe proponer Atención inteligente');
  assert.equal(atencion.prioridad, 1);
  assert.equal(atencion.nombre, 'Atención inteligente');
  /* La evidencia cita la respuesta literal, no una paráfrasis. */
  assert.ok(
    atencion.evidencia.some((e) => e.includes('El tiempo varía y algunas solicitudes pueden perderse')),
  );
  assert.ok(atencion.evidencia.some((e) => e.startsWith('P08 ·')));
});

test('Nadie sigue a quien no agenda → CRM, y la evidencia trae P09 y P10', () => {
  const r = evaluarDiagnostico(
    base({
      'q9-conversion-citas': { conversion: 2 },
      'q10-seguimiento': { seguimiento: 'Ya no se le vuelve a contactar' },
    }),
  );

  const crm = r.plan.recomendaciones.find((x) => x.modulo === 'crm');
  assert.ok(crm);
  assert.equal(crm.prioridad, 1);
  assert.ok(crm.evidencia.some((e) => e === 'P09 · De cada 10 interesados agendan: 2'));
  assert.ok(crm.evidencia.some((e) => e.includes('Ya no se le vuelve a contactar')));
});

test('Ausencias altas y base dormida → un solo módulo Agenda con la evidencia de ambas etapas', () => {
  const r = evaluarDiagnostico(
    base({
      'q12-ausencias': { ausencias: 5 },
      'q17-recuperacion': { recuperacion: 'No tenemos forma de saber qué pacientes deberían regresar' },
    }),
  );

  const agenda = r.plan.recomendaciones.filter((x) => x.modulo === 'agenda');
  assert.equal(agenda.length, 1, 'no debe duplicarse el módulo');
  assert.equal(agenda[0].prioridad, 1);
  assert.ok(agenda[0].evidencia.some((e) => e.startsWith('P12 ·')));
  assert.ok(agenda[0].evidencia.some((e) => e.startsWith('P17 ·')));
});

test('El sitio web no aparece en ningún canal → se propone Web, y nunca como urgente', () => {
  const r = evaluarDiagnostico(
    base({
      'q4-origen': { origen: ['Recomendaciones de otros pacientes'] },
      'q5-medios': { medios: ['WhatsApp'] },
    }),
  );

  const web = r.plan.recomendaciones.find((x) => x.modulo === 'web');
  assert.ok(web);
  assert.ok(web.prioridad >= 2, 'un canal ausente no es una fuga activa');
});

test('Sitio web presente como canal → NO se propone Web', () => {
  const r = evaluarDiagnostico(base());
  assert.ok(!modulos(r).includes('web'));
});

test('Sistemas que no se hablan → Automatización y datos, citando P18', () => {
  const r = evaluarDiagnostico(
    base({ 'q18-sistemas': { sistemas: 'Utilizamos varios sistemas que no se comunican entre sí' } }),
  );

  const datos = r.plan.recomendaciones.find((x) => x.modulo === 'datos');
  assert.ok(datos);
  assert.ok(datos.evidencia.some((e) => e.includes('Utilizamos varios sistemas que no se comunican entre sí')));
});

test('Orden: lo urgente va antes que lo mejorable, y el empate sigue el embudo', () => {
  const r = evaluarDiagnostico(
    base({
      /* rojo en asistencia (agenda) y amarillo en respuesta (atención) */
      'q12-ausencias': { ausencias: 5 },
      'q7-respuesta-dentro': { dentro: 'Entre 16 y 60 minutos' },
      'q8-respuesta-fuera': { fuera: 'Más tarde ese mismo día' },
    }),
  );

  const orden = modulos(r);
  assert.equal(orden[0], 'agenda', 'la fuga activa va primero aunque atención sea del embudo temprano');
  assert.ok(orden.indexOf('atencion') > 0);
});

test('No miden el tiempo de respuesta → se propone Atención, pero como refuerzo, no como fuga', () => {
  const r = evaluarDiagnostico(
    base({
      'q7-respuesta-dentro': { dentro: 'No lo medimos' },
      'q8-respuesta-fuera': { fuera: 'No lo medimos' },
    }),
  );

  assert.equal(r.etapas.respuesta.color, 'gris');
  const atencion = r.plan.recomendaciones.find((x) => x.modulo === 'atencion');
  assert.ok(atencion, 'no medir también es un hallazgo');
  assert.equal(atencion.prioridad, 3, 'sin medición no se puede afirmar que haya fuga');
  assert.ok(atencion.motivo.includes('No se mide'));
});

test('Clínica rota → prioridad alta y el plan en texto cita las evidencias', () => {
  const r = evaluarDiagnostico(
    base({
      'q7-respuesta-dentro': { dentro: 'El tiempo varía y algunas solicitudes pueden perderse' },
      'q8-respuesta-fuera': { fuera: 'Depende; algunas solicitudes pueden perderse' },
      'q9-conversion-citas': { conversion: 2 },
      'q10-seguimiento': { seguimiento: 'Ya no se le vuelve a contactar' },
      'q12-ausencias': { ausencias: 5 },
      'q17-recuperacion': { recuperacion: 'Normalmente no se le vuelve a contactar' },
    }),
  );

  assert.equal(r.plan.temperatura, 'alta');
  assert.ok(r.plan.recomendaciones.length >= 3);
  assert.equal(r.plan.recomendaciones[0].prioridad, 1);

  const texto = transcribirPlan(r.plan);
  assert.ok(texto.startsWith('Prioridad del lead: ALTA'));
  assert.ok(texto.includes('Evidencia:'));
  assert.ok(texto.includes('1. '));
});

test('Sin datos para estimar y sin rojos → prioridad baja, no se quema el seguimiento', () => {
  const r = evaluarDiagnostico(
    base({
      'q3-volumen': { volumen: 'No lo sabemos' },
      'q9-conversion-citas': { conversion: 'No lo sabemos' },
      'q11-citas': { citas: 'No lo sabemos' },
      'q12-ausencias': { ausencias: 'No lo sabemos' },
      'q13-valor-cita': { valorCita: 'Preferimos no responder o no lo sabemos' },
      'q14-conversion-tratamiento': { conversionTratamiento: 'No lo sabemos' },
      'q16-valor-tratamiento': { valorTratamiento: 'No aplica' },
    }),
  );

  assert.equal(r.impacto.modo, 'insuficiente');
  assert.equal(r.plan.temperatura, 'baja');
  /* Varias etapas en gris: se propone medición, que es justo lo que falta. */
  assert.ok(modulos(r).includes('datos'));
});

test('El plan es determinístico: la misma entrada produce el mismo plan', () => {
  const entrada = base({ 'q12-ausencias': { ausencias: 6 } });
  assert.deepEqual(
    evaluarDiagnostico(entrada).plan,
    evaluarDiagnostico(entrada).plan,
  );
});
