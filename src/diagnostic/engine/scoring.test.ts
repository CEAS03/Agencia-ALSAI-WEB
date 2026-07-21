import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluarDiagnostico, type RespuestasCrudas } from './scoring.ts';

/**
 * Casos de prueba del motor de scoring (npm test).
 * Los valores esperados están verificados a mano con las fórmulas de la
 * metodología y asumen las constantes por defecto:
 *   RECOVERY = { bajo: 0.20, alto: 0.40 }
 *   VALORACION_RATE = 0.70
 *   PRESENTACION = 'recuperable'
 * Si Carlos recalibra esas constantes, recalcular los montos esperados.
 */

/** Clínica de referencia completa; cada caso sobreescribe lo que necesita. */
function base(overrides: RespuestasCrudas = {}): RespuestasCrudas {
  return {
    'q1-tipo': { tipo: 'Clínica dental' },
    'q2-agenda': { capacidad: 'La ocupación es irregular: algunos días se llenan y otros quedan vacíos' },
    'q3-volumen': { volumen: 'Entre 25 y 50' },
    'q4-origen': { origen: ['Recomendaciones de otros pacientes', 'Google o Google Maps'] },
    'q5-medios': { medios: ['WhatsApp', 'Llamada telefónica'] },
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
    'q18-sistemas': { sistemas: 'Tenemos software de citas, pero los mensajes y seguimientos están separados' },
    'q19-prioridad': { prioridad: ['Convertir más solicitudes en citas'] },
    ...overrides,
  };
}

test('1. Todo "No lo sabemos" en preguntas numéricas → insuficiente y colores mayormente gris', () => {
  const r = evaluarDiagnostico(
    base({
      'q3-volumen': { volumen: 'No lo sabemos' },
      'q7-respuesta-dentro': { dentro: 'No lo medimos' },
      'q8-respuesta-fuera': { fuera: 'No lo medimos' },
      'q9-conversion-citas': { conversion: 'No lo sabemos' },
      'q10-seguimiento': { seguimiento: 'Algunas veces recibe seguimiento y otras se pierde' },
      'q11-citas': { citas: 'No lo sabemos' },
      'q12-ausencias': { ausencias: 'No lo sabemos' },
      'q13-valor-cita': { valorCita: 'Preferimos no responder o no lo sabemos' },
      'q14-conversion-tratamiento': { conversionTratamiento: 'No lo sabemos' },
      'q15-tratamientos-pendientes': { pendientes: 'Algunas veces se le da seguimiento y otras se pierde' },
      'q16-valor-tratamiento': { valorTratamiento: 'No aplica' },
      'q17-recuperacion': { recuperacion: 'Se le contacta solo en algunas ocasiones' },
    }),
  );

  assert.equal(r.impacto.modo, 'insuficiente');
  assert.equal(r.impacto.dinero_min, undefined);
  assert.equal(r.impacto.volumen_min, undefined);
  assert.deepEqual(r.impacto.palancas_usadas, []);
  assert.deepEqual(r.impacto.desglose, []);
  assert.equal(r.etapas.captacion.color, 'gris');
  assert.equal(r.etapas.respuesta.color, 'gris');
  assert.equal(r.etapas.agenda.color, 'gris');
  assert.equal(r.etapas.asistencia.color, 'gris');
});

test('2. Clínica sana → todo verde y dinero bajo pero honesto (>0 porque hay fuga real)', () => {
  const r = evaluarDiagnostico(base());

  for (const etapa of Object.values(r.etapas)) {
    assert.equal(etapa.color, 'verde');
  }

  // A: [25,50]×0.2×[1000,2500]  → [1000/0.2r, …]  ⇒ bajo 1000, alto 10000
  // B: [50,125]×0.1×[1000,2500] ⇒ bajo 1000, alto 12500
  // C: [45,112.5]×0.7×0.2×[4000,7500] ⇒ bajo 5040, alto 47250
  // Total [7040, 69750] → redondeo [7000, 70000]
  assert.equal(r.impacto.modo, 'pesos');
  assert.equal(r.impacto.dinero_min, 7000);
  assert.equal(r.impacto.dinero_max, 70000);
  assert.ok((r.impacto.dinero_min ?? 0) > 0);
  assert.deepEqual(r.impacto.palancas_usadas, ['A', 'B', 'C']);
});

test('3. Valoración sin costo → A y B no monetizan; solo la Palanca C va a pesos', () => {
  const r = evaluarDiagnostico(
    base({
      'q13-valor-cita': { valorCita: 'La valoración o primera consulta no tiene costo' },
      'q9-conversion-citas': { conversion: 5 },
      'q12-ausencias': { ausencias: 2 },
      'q14-conversion-tratamiento': { conversionTratamiento: 5 },
    }),
  );

  // C: atendidas [40,100] × 0.7 × 0.5 × [4000,7500] × [0.2,0.4] = [11200, 105000]
  assert.equal(r.impacto.modo, 'pesos');
  assert.deepEqual(r.impacto.palancas_usadas, ['C']);
  assert.equal(r.impacto.dinero_min, 11000);
  assert.equal(r.impacto.dinero_max, 105000);
  assert.ok(r.impacto.supuestos_aplicados.some((s) => s.startsWith('VALORACION_RATE')));
});

test('4. Spa (Q14 no aplica) → Conversión gris, Palanca C desactivada, sin inventar tratamiento', () => {
  const r = evaluarDiagnostico(
    base({
      'q1-tipo': { tipo: 'Clínica de belleza, spa o bienestar' },
      'q3-volumen': { volumen: 'Entre 15 y 25' },
      'q9-conversion-citas': { conversion: 6 },
      'q11-citas': { citas: 'Entre 25 y 50' },
      'q12-ausencias': { ausencias: 2 },
      'q13-valor-cita': { valorCita: 'Entre $500 y $1,000 MXN' },
      'q14-conversion-tratamiento': { conversionTratamiento: 'No aplica a nuestro tipo de clínica' },
      'q15-tratamientos-pendientes': { pendientes: 'No aplica a nuestro tipo de clínica' },
      'q16-valor-tratamiento': { valorTratamiento: 'No aplica' },
    }),
  );

  assert.equal(r.etapas.conversion.color, 'gris');
  assert.equal(r.impacto.modo, 'pesos');
  assert.deepEqual(r.impacto.palancas_usadas, ['A', 'B']);
  assert.ok(!r.impacto.supuestos_aplicados.some((s) => s.startsWith('VALORACION_RATE')));
  // A: [6,10]×[500,1000]×[0.2,0.4] = [600,4000]; B: [5,10]×[500,1000]×[0.2,0.4] = [500,4000]
  assert.equal(r.impacto.dinero_min, 1000);
  assert.equal(r.impacto.dinero_max, 8000);
});

test('5. Fuga clásica → tres palancas sumadas sin doble conteo, rango verificado a mano', () => {
  const r = evaluarDiagnostico(
    base({
      'q9-conversion-citas': { conversion: 3 },
      'q10-seguimiento': { seguimiento: 'Algunas veces recibe seguimiento y otras se pierde' },
      'q12-ausencias': { ausencias: 4 },
      'q14-conversion-tratamiento': { conversionTratamiento: 4 },
      'q15-tratamientos-pendientes': { pendientes: 'Algunas veces se le da seguimiento y otras se pierde' },
      'q17-recuperacion': { recuperacion: 'Normalmente no se le vuelve a contactar' },
    }),
  );

  assert.equal(r.etapas.agenda.color, 'rojo');
  assert.equal(r.etapas.asistencia.color, 'rojo');
  assert.equal(r.etapas.conversion.color, 'amarillo');
  assert.equal(r.etapas.recuperacion.color, 'rojo');

  // A: [25,50]×0.7×[1000,2500]×[0.2,0.4]  = [3500, 35000]
  // B: [50,125]×0.4×[1000,2500]×[0.2,0.4] = [4000, 50000]
  // C: [30,75]×0.7×0.6×[4000,7500]×[0.2,0.4] = [10080, 94500]
  // Total [17580, 179500] → redondeo [17000, 180000]
  assert.equal(r.impacto.modo, 'pesos');
  assert.deepEqual(r.impacto.palancas_usadas, ['A', 'B', 'C']);
  assert.equal(r.impacto.dinero_min, 17000);
  assert.equal(r.impacto.dinero_max, 180000);

  // Desglose "Ver fórmulas": cada línea muestra los números reales usados.
  assert.equal(r.impacto.desglose.length, 3);
  const [a, b, c] = r.impacto.desglose;
  assert.equal(a.calculo_bajo, 'Mínimo: 25 × 70% × $1,000 × 20% = $3,500');
  assert.equal(a.calculo_alto, 'Máximo: 50 × 70% × $2,500 × 40% = $35,000');
  assert.equal(b.calculo_bajo, 'Mínimo: 50 × 40% × $1,000 × 20% = $4,000');
  assert.equal(b.calculo_alto, 'Máximo: 125 × 40% × $2,500 × 40% = $50,000');
  assert.equal(c.calculo_bajo, 'Mínimo: 30 × 70% × 60% × $4,000 × 20% = $10,080');
  assert.equal(c.calculo_alto, 'Máximo: 75 × 70% × 60% × $7,500 × 40% = $94,500');
  assert.ok(a.datos.some((d) => d.respuesta === 'Entre 25 y 50'));
  assert.ok(c.datos.some((d) => d.etiqueta.startsWith('Supuesto')));
  assert.ok(r.impacto.nota_total.includes('$17,580 a $179,500'));
  assert.ok(r.impacto.nota_total.includes('$17,000 a $180,000'));
  assert.equal(r.impacto.notas.length, 2);
});

test('Extra: sin precios usables pero con volumen → modo volumen con conteo de oportunidades', () => {
  const r = evaluarDiagnostico(
    base({
      'q3-volumen': { volumen: 'Entre 15 y 25' },
      'q9-conversion-citas': { conversion: 6 },
      'q11-citas': { citas: 'Entre 25 y 50' },
      'q12-ausencias': { ausencias: 2 },
      'q13-valor-cita': { valorCita: 'Preferimos no responder o no lo sabemos' },
      'q14-conversion-tratamiento': { conversionTratamiento: 5 },
      'q16-valor-tratamiento': { valorTratamiento: 'No aplica' },
    }),
  );

  // A: [15,25]×0.4 = [6,10] · B: [25,50]×0.2 = [5,10] · C: [20,40]×0.5 = [10,20]
  assert.equal(r.impacto.modo, 'volumen');
  assert.equal(r.impacto.volumen_min, 21);
  assert.equal(r.impacto.volumen_max, 40);
  assert.deepEqual(r.impacto.palancas_usadas, ['A', 'B', 'C']);

  // El desglose en modo volumen no menciona dinero.
  assert.equal(r.impacto.desglose.length, 3);
  assert.equal(r.impacto.desglose[0].calculo_bajo, 'Mínimo: 15 × 40% = 6 citas');
  assert.ok(r.impacto.desglose.every((p) => !p.formula.includes('valor')));
});

test('Extra: el motor es determinístico — la misma entrada produce el mismo resultado', () => {
  const entrada = base();
  assert.deepEqual(evaluarDiagnostico(entrada), evaluarDiagnostico(entrada));
});
