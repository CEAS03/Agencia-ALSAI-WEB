import type { QuestionPayload } from './types';

/**
 * ── GUION OFICIAL DEL DIAGNÓSTICO (19 preguntas) ─────────────────────
 * Las preguntas SIEMPRE corren locales; n8n solo recibe el paquete final
 * (ver adapter.ts e INTEGRATION_N8N.md).
 *
 * ⚠️ Los textos de las opciones son contrato del motor de scoring
 * (engine/scoring.ts): si cambias un texto aquí, actualízalo allá.
 *
 * Criterio de orden: en las preguntas de madurez, las opciones van de
 * "no existe proceso / no lo sabemos" hacia el escenario ideal.
 */
export type DemoStep = Omit<QuestionPayload, 'index' | 'total'>;

export const DEMO_STEPS: DemoStep[] = [
  {
    id: 'q1-tipo',
    title: '¿Qué tipo de clínica es?',
    analysisNote: 'Ajustando el análisis al tipo de clínica…',
    fields: [
      {
        id: 'tipo',
        kind: 'single',
        options: [
          'Clínica dental',
          'Clínica de medicina estética',
          'Clínica médica o de especialidad',
          'Clínica de belleza, spa o bienestar',
          'Nutrición, rehabilitación o terapias',
          'Clínica multidisciplinaria',
          'Otra',
        ],
      },
    ],
  },
  {
    id: 'q2-agenda',
    title: 'Durante las últimas cuatro semanas, ¿cómo se ha comportado la agenda de la clínica?',
    analysisNote: 'Evaluando la capacidad real de la agenda…',
    fields: [
      {
        id: 'capacidad',
        kind: 'single',
        options: [
          'No tenemos esta información con claridad',
          'Tenemos muchos espacios disponibles la mayoría de los días',
          'La ocupación es irregular: algunos días se llenan y otros quedan vacíos',
          'Está casi llena, pero quedan huecos por cancelaciones o cambios',
          'Trabajamos cerca de nuestra capacidad máxima',
          'Tenemos lista de espera o demanda que no podemos atender',
        ],
      },
    ],
  },
  {
    id: 'q3-volumen',
    title:
      'En los últimos 30 días, aproximadamente, ¿cuántas personas nuevas contactaron a la clínica para solicitar información, precios o una cita?',
    note: 'Cuenta personas nuevas, no mensajes individuales ni pacientes que ya estaban en seguimiento.',
    analysisNote: 'Midiendo el volumen de demanda entrante…',
    fields: [
      {
        id: 'volumen',
        kind: 'single',
        options: [
          'Menos de 5',
          'Entre 5 y 10',
          'Entre 10 y 15',
          'Entre 15 y 25',
          'Entre 25 y 50',
          'Entre 50 y 100',
          'Más de 100',
          'No lo sabemos',
        ],
      },
    ],
  },
  {
    id: 'q4-origen',
    title: 'Sus pacientes nuevos, ¿por dónde suelen descubrir la clínica?',
    analysisNote: 'Analizando sus canales de descubrimiento…',
    fields: [
      {
        id: 'origen',
        kind: 'multi',
        maxSelect: 3,
        options: [
          'Recomendaciones de otros pacientes',
          'Google o Google Maps',
          'Instagram, Facebook o TikTok',
          'Anuncios pagados',
          'Sitio web o búsquedas orgánicas',
          'Directorios, aseguradoras o plataformas externas',
          'Alianzas o convenios',
          'Ubicación física de la clínica',
          'No lo sabemos',
          'Otro',
        ],
      },
    ],
  },
  {
    id: 'q5-medios',
    title: '¿Por qué medios suelen solicitar información?',
    analysisNote: 'Mapeando sus canales de contacto…',
    fields: [
      {
        id: 'medios',
        kind: 'multi',
        options: [
          'WhatsApp',
          'Llamada telefónica',
          'Mensajes de Instagram o Facebook',
          'Formulario o chat del sitio web',
          'Plataforma de citas',
          'Correo electrónico',
          'Otro',
        ],
      },
    ],
  },
  {
    id: 'q6-publicidad',
    title:
      'Actualmente, ¿cuánto invierte aproximadamente la clínica en publicidad para atraer pacientes nuevos?',
    analysisNote: 'Relacionando inversión publicitaria con resultados…',
    fields: [
      {
        id: 'inversion',
        kind: 'single',
        options: [
          'No invertimos; los pacientes llegan por recomendación u otros medios orgánicos',
          'Menos de $2,000 MXN al mes',
          'Entre $2,000 y $5,000 MXN al mes',
          'Entre $5,000 y $20,000 MXN al mes',
          'Más de $20,000 MXN al mes',
          'La inversión cambia considerablemente cada mes',
          'No lo sabemos',
        ],
      },
    ],
  },
  {
    id: 'q7-respuesta-dentro',
    title:
      'Durante el horario de atención, ¿cuánto tarda normalmente una persona nueva en recibir una respuesta?',
    analysisNote: 'Midiendo su velocidad de respuesta…',
    fields: [
      {
        id: 'dentro',
        kind: 'single',
        options: [
          'Menos de 5 minutos',
          'Entre 5 y 15 minutos',
          'Entre 16 y 60 minutos',
          'Entre 1 y 4 horas',
          'Más de 4 horas, pero el mismo día',
          'El tiempo varía y algunas solicitudes pueden perderse',
          'No lo medimos',
        ],
      },
    ],
  },
  {
    id: 'q8-respuesta-fuera',
    title:
      'Si una persona nueva escribe fuera del horario de atención —por ejemplo, un sábado a las 9 de la noche—, ¿cuándo recibe una respuesta?',
    analysisNote: 'Evaluando su cobertura fuera de horario…',
    fields: [
      {
        id: 'fuera',
        kind: 'single',
        options: [
          'En minutos, aunque sea fuera del horario',
          'Más tarde ese mismo día',
          'Durante el mismo fin de semana',
          'Al comenzar el siguiente horario de atención',
          'Depende; algunas solicitudes pueden perderse',
          'No lo medimos',
        ],
      },
    ],
  },
  {
    id: 'q9-conversion-citas',
    title:
      'De cada 10 personas nuevas que solicitan información, precios o una cita, ¿cuántas terminan agendando?',
    analysisNote: 'Calculando su tasa de conversión a cita…',
    fields: [{ id: 'conversion', kind: 'scale', escapes: ['No lo sabemos'] }],
  },
  {
    id: 'q10-seguimiento',
    title:
      '¿Qué sucede cuando una persona solicita información, pero no agenda en el primer contacto?',
    analysisNote: 'Detectando oportunidades sin seguimiento…',
    fields: [
      {
        id: 'seguimiento',
        kind: 'single',
        options: [
          'No tenemos forma de saberlo',
          'Ya no se le vuelve a contactar',
          'Algunas veces recibe seguimiento y otras se pierde',
          'Normalmente recibe uno o dos mensajes manuales',
          'Una persona responsable le da seguimiento manual de forma consistente',
          'Entra en un proceso registrado con seguimiento automático y atención humana',
        ],
      },
    ],
  },
  {
    id: 'q11-citas',
    title: 'Aproximadamente, ¿cuántas citas programa la clínica al mes?',
    analysisNote: 'Dimensionando el volumen de citas…',
    fields: [
      {
        id: 'citas',
        kind: 'single',
        options: [
          'Menos de 25',
          'Entre 25 y 50',
          'Entre 50 y 125',
          'Entre 125 y 250',
          'Más de 250',
          'No lo sabemos',
        ],
      },
    ],
  },
  {
    id: 'q12-ausencias',
    title:
      'De cada 10 citas programadas, ¿cuántas se cancelan con tan poca anticipación que el espacio no puede recuperarse o no se presentan?',
    analysisNote: 'Estimando el costo de cancelaciones y ausencias…',
    fields: [{ id: 'ausencias', kind: 'scale', escapes: ['No lo sabemos'] }],
  },
  {
    id: 'q13-valor-cita',
    title: '¿Cuál es aproximadamente el precio promedio de una cita?',
    analysisNote: 'Asignando valor económico a cada cita…',
    fields: [
      {
        id: 'valorCita',
        kind: 'single',
        options: [
          'La valoración o primera consulta no tiene costo',
          'Menos de $500 MXN',
          'Entre $500 y $1,000 MXN',
          'Entre $1,000 y $2,500 MXN',
          'Entre $2,500 y $5,000 MXN',
          'Entre $5,000 y $10,000 MXN',
          'Más de $10,000 MXN',
          'Preferimos no responder o no lo sabemos',
        ],
      },
    ],
  },
  {
    id: 'q14-conversion-tratamiento',
    title:
      'De cada 10 pacientes que asisten a una valoración y reciben una recomendación, cotización o plan de tratamiento, ¿cuántos avanzan con el tratamiento?',
    analysisNote: 'Midiendo la conversión a tratamiento…',
    fields: [
      {
        id: 'conversionTratamiento',
        kind: 'scale',
        escapes: ['No lo sabemos', 'No aplica a nuestro tipo de clínica'],
      },
    ],
  },
  {
    id: 'q15-tratamientos-pendientes',
    title:
      'Cuando un paciente recibe una valoración, cotización o plan de tratamiento y no lo acepta o inicia ese día, ¿qué sucede?',
    analysisNote: 'Rastreando tratamientos pendientes…',
    fields: [
      {
        id: 'pendientes',
        kind: 'single',
        options: [
          'No aplica a nuestro tipo de clínica',
          'No existe un proceso definido',
          'Solo se retoma el contacto si el paciente vuelve a escribir',
          'Algunas veces se le da seguimiento y otras se pierde',
          'Normalmente recibe uno o dos mensajes manuales',
          'El equipo le da seguimiento manual mediante un proceso definido',
          'Recibe seguimiento combinado entre automatización y atención humana',
          'Queda registrado con etapa, responsable, próxima acción y seguimiento estructurado',
        ],
      },
    ],
  },
  {
    id: 'q16-valor-tratamiento',
    title:
      '¿Cuál es aproximadamente el precio del tratamiento, procedimiento o plan de servicios que la clínica vende con mayor frecuencia?',
    analysisNote: 'Calculando el valor del ticket más frecuente…',
    fields: [
      {
        id: 'valorTratamiento',
        kind: 'single',
        options: [
          'No aplica',
          'Menos de $500 MXN',
          'Entre $500 y $1,500 MXN',
          'Entre $1,500 y $4,000 MXN',
          'Entre $4,000 y $7,500 MXN',
          'Entre $7,500 y $12,500 MXN',
          'Más de $12,500 MXN',
        ],
      },
    ],
  },
  {
    id: 'q17-recuperacion',
    title:
      'Cuando un paciente debería regresar —por seguimiento, mantenimiento, revisión o una nueva sesión— y no lo hace, ¿qué sucede?',
    analysisNote: 'Evaluando la recuperación de pacientes…',
    fields: [
      {
        id: 'recuperacion',
        kind: 'single',
        options: [
          'No aplica a nuestra operación',
          'No tenemos forma de saber qué pacientes deberían regresar',
          'La base de pacientes no está suficientemente organizada',
          'Normalmente no se le vuelve a contactar',
          'Se le contacta solo en algunas ocasiones',
          'El equipo trabaja periódicamente una lista o campaña de recuperación',
          'Se detecta automáticamente y recibe comunicación según su tratamiento',
        ],
      },
    ],
  },
  {
    id: 'q18-sistemas',
    title:
      '¿Cómo están conectados actualmente WhatsApp, la agenda y la información de los pacientes?',
    analysisNote: 'Mapeando la integración de sus sistemas…',
    fields: [
      {
        id: 'sistemas',
        kind: 'single',
        options: [
          'No tenemos claridad sobre cómo se centraliza la información',
          'Utilizamos una agenda física o registros manuales',
          'Trabajamos principalmente con WhatsApp, calendarios u hojas de cálculo',
          'Utilizamos varios sistemas que no se comunican entre sí',
          'Tenemos software de citas, pero los mensajes y seguimientos están separados',
          'Todo está conectado y actualizado en un mismo sistema',
        ],
      },
    ],
  },
  {
    id: 'q19-prioridad',
    title: '¿Qué resultado tendría mayor impacto para la clínica durante los próximos 90 días?',
    analysisNote: 'Priorizando los resultados de mayor impacto…',
    fields: [
      {
        id: 'prioridad',
        kind: 'multi',
        options: [
          'Atraer más pacientes adecuados',
          'Convertir más solicitudes en citas',
          'Reducir cancelaciones y ausencias',
          'Recuperar tratamientos o procedimientos pendientes',
          'Reactivar pacientes que dejaron de asistir',
          'Liberar tiempo del equipo',
          'Tener mayor control y medición',
          'Integrar la operación en un solo sistema',
          'Aumentar la capacidad de atención',
        ],
      },
    ],
  },
];
