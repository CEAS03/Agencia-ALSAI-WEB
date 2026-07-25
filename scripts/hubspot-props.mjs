/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ESQUEMA DE PROPIEDADES DEL DIAGNÓSTICO EN HUBSPOT
 *
 *  Fuente única de la verdad: lo importan `hubspot-setup.mjs` (que las crea)
 *  y `test-hubspot-lead.mjs` (que comprueba que la función las escribe).
 *
 *  Dos grupos, a propósito:
 *    · alsai_diagnostico  — quién es, qué salió y qué hacer con él.
 *    · alsai_respuestas   — las 19 respuestas, una propiedad por pregunta,
 *                           en orden, para poder filtrar y segmentar.
 *
 *  ⚠️ CONTRATO CON EL GUION
 *  Los `value` de las listas son el texto literal de las opciones de
 *  `src/diagnostic/demoScript.ts`. Si allá cambia un texto, aquí también:
 *  HubSpot rechaza un valor que no esté entre las opciones declaradas.
 *  Única transformación: los `;` se sustituyen por `,` (HubSpot usa el
 *  punto y coma para separar valores múltiples). `normalizarOpcion()` la
 *  aplica en los dos lados, así que nunca hay que recordarla a mano.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const GRUPO_DIAG = 'alsai_diagnostico';
export const GRUPO_RESP = 'alsai_respuestas';

/** HubSpot separa valores múltiples con `;`: dentro de un valor no puede haber. */
export const normalizarOpcion = (texto) =>
  typeof texto === 'string' ? texto.replace(/;/g, ',').trim() : '';

/* ── Atajos de definición ─────────────────────────────────────────────── */

const campo = (grupo, tipo, fieldType) => (name, label, description, extra = {}) => ({
  name,
  label,
  description,
  type: tipo,
  fieldType,
  groupName: grupo,
  ...extra,
});

const dTexto = campo(GRUPO_DIAG, 'string', 'text');
const dParrafo = campo(GRUPO_DIAG, 'string', 'textarea');
const dNumero = campo(GRUPO_DIAG, 'number', 'number');
const dFecha = campo(GRUPO_DIAG, 'datetime', 'date');

/** Convierte una lista de textos en opciones ordenadas de HubSpot. */
const opciones = (textos) =>
  textos.map((t, i) => ({
    label: t,
    value: normalizarOpcion(t),
    displayOrder: i,
    hidden: false,
  }));

/**
 * Pregunta del guion. `orden` fija la posición en la ficha del contacto para
 * que se lean P01 → P19 de corrido, que es justo lo que hace legible el grupo.
 */
const pregunta = (orden, name, label, preguntaLiteral, extra) => ({
  name,
  label,
  description: preguntaLiteral,
  groupName: GRUPO_RESP,
  displayOrder: orden,
  ...extra,
});

/** Pregunta de opción única. */
const pUnica = (orden, name, label, literal, textos) =>
  pregunta(orden, name, label, literal, {
    type: 'enumeration',
    fieldType: 'select',
    options: opciones(textos),
  });

/** Pregunta de opción múltiple (casillas). Los valores se guardan con `;`. */
const pMulti = (orden, name, label, literal, textos) =>
  pregunta(orden, name, label, literal, {
    type: 'enumeration',
    fieldType: 'checkbox',
    options: opciones(textos),
  });

/**
 * Escala 0–10. Va como número para poder promediar y ordenar.
 * Cuando el prospecto elige una salida ("No lo sabemos", "No aplica") la
 * propiedad queda VACÍA y se filtra en HubSpot con "is unknown"; el texto
 * literal de esa salida se conserva en `alsai_diag_respuestas`.
 */
const pEscala = (orden, name, label, literal) =>
  pregunta(orden, name, label, `${literal} (0 a 10; vacío = eligió una salida como "No lo sabemos")`, {
    type: 'number',
    fieldType: 'number',
  });

/* ── Colores del semáforo ─────────────────────────────────────────────── */

const COLORES = [
  { label: 'Verde — sano', value: 'verde', displayOrder: 0 },
  { label: 'Amarillo — mejorable', value: 'amarillo', displayOrder: 1 },
  { label: 'Rojo — fuga', value: 'rojo', displayOrder: 2 },
  { label: 'Gris — sin datos', value: 'gris', displayOrder: 3 },
];

const etapa = (clave, numero, etiqueta) =>
  campo(GRUPO_DIAG, 'enumeration', 'select')(
    `alsai_diag_etapa_${clave}`,
    `Etapa ${numero}: ${etiqueta}`,
    `Color asignado por el motor de diagnóstico a la etapa "${etiqueta}".`,
    { options: COLORES, displayOrder: 29 + numero },
  );

/** Los 6 módulos de /soluciones. Contrato con `engine/soluciones.ts`. */
export const MODULOS = [
  { value: 'captacion', label: 'Captación y demanda' },
  { value: 'atencion', label: 'Atención inteligente' },
  { value: 'crm', label: 'CRM y proceso comercial' },
  { value: 'agenda', label: 'Agenda, seguimiento y recuperación' },
  { value: 'web', label: 'Experiencias web que convierten' },
  { value: 'datos', label: 'Automatización, datos y optimización' },
].map((m, i) => ({ ...m, displayOrder: i }));

/* ── Grupo 1 · Diagnóstico (quién es, qué salió, qué hacer) ───────────── */

export const PROPIEDADES_DIAGNOSTICO = [
  /* Contexto del envío */
  { ...dFecha('alsai_diag_fecha', 'Diagnóstico completado el', 'Fecha y hora en que se terminó el diagnóstico.'), displayOrder: 1 },
  {
    ...campo(GRUPO_DIAG, 'enumeration', 'select')(
      'alsai_diag_origen',
      'Origen del diagnóstico',
      'Desde qué propiedad se completó: el sitio web o la tarjeta digital NFC.',
      {
        options: [
          { label: 'Sitio web (agencia-alsai.com)', value: 'sitio-web', displayOrder: 0 },
          { label: 'Tarjeta digital NFC (conecta.)', value: 'tarjeta-nfc', displayOrder: 1 },
        ],
      },
    ),
    displayOrder: 2,
  },
  { ...dNumero('alsai_diag_duracion_min', 'Minutos que tardó en contestar', 'Tiempo entre la primera pregunta y el envío. Menos de 2 minutos es sospechoso; más de 5 indica que lo contestó con atención.'), displayOrder: 3 },
  { ...dTexto('alsai_diag_session', 'ID de sesión', 'Identificador de la sesión de diagnóstico, para rastrear el origen.'), displayOrder: 4 },
  {
    ...campo(GRUPO_DIAG, 'enumeration', 'select')(
      'alsai_diag_consentimiento',
      'Aceptó el aviso de privacidad',
      'Marcado en el formulario de contacto del diagnóstico.',
      {
        options: [
          { label: 'Sí', value: 'true', displayOrder: 0 },
          { label: 'No', value: 'false', displayOrder: 1 },
        ],
      },
    ),
    displayOrder: 5,
  },

  /* Perfil de la clínica (atajos de P01, P18 y P19) */
  { ...dTexto('alsai_diag_tipo_clinica', 'Tipo de clínica', 'Giro declarado en la pregunta 1. Atajo de alsai_p01_tipo_clinica.'), displayOrder: 10 },
  { ...dTexto('alsai_diag_infraestructura', 'Infraestructura actual', 'Herramientas y sistemas que ya usa la clínica. Atajo de alsai_p18_sistemas_conectados.'), displayOrder: 11 },
  { ...dTexto('alsai_diag_objetivo_90d', 'Objetivo a 90 días', 'Prioridad declarada por el prospecto. Atajo de alsai_p19_objetivo_90d.'), displayOrder: 12 },

  /* Impacto estimado */
  {
    ...campo(GRUPO_DIAG, 'enumeration', 'select')(
      'alsai_diag_impacto_modo',
      'Modo de la estimación',
      'Si el impacto pudo calcularse en pesos, en volumen de citas, o no hubo datos suficientes.',
      {
        options: [
          { label: 'Pesos (MXN al mes)', value: 'pesos', displayOrder: 0 },
          { label: 'Volumen (citas al mes)', value: 'volumen', displayOrder: 1 },
          { label: 'Datos insuficientes', value: 'insuficiente', displayOrder: 2 },
        ],
      },
    ),
    displayOrder: 20,
  },
  { ...dTexto('alsai_diag_impacto_etiqueta', 'Impacto estimado', 'Texto del rango tal como se le mostró al prospecto.'), displayOrder: 21 },
  { ...dNumero('alsai_diag_impacto_min', 'Impacto estimado (mínimo)', 'Extremo bajo del rango. En pesos o en citas según el modo.'), displayOrder: 22 },
  { ...dNumero('alsai_diag_impacto_max', 'Impacto estimado (máximo)', 'Extremo alto del rango. En pesos o en citas según el modo.'), displayOrder: 23 },
  { ...dTexto('alsai_diag_palancas', 'Palancas de fuga usadas', 'Cuáles de las tres palancas (A: no agendan · B: no asisten · C: no cierran tratamiento) pudieron calcularse con sus respuestas.'), displayOrder: 24 },

  /* Semáforo */
  etapa('captacion', 1, 'Captación'),
  etapa('respuesta', 2, 'Respuesta'),
  etapa('agenda', 3, 'Agenda'),
  etapa('asistencia', 4, 'Asistencia'),
  etapa('conversion', 5, 'Conversión'),
  etapa('recuperacion', 6, 'Recuperación'),
  { ...dNumero('alsai_diag_etapas_rojas', 'Etapas en rojo', 'Cuántas de las 6 etapas salieron en rojo. Útil para priorizar el seguimiento.'), displayOrder: 36 },
  { ...dNumero('alsai_diag_etapas_amarillas', 'Etapas en amarillo', 'Cuántas de las 6 etapas salieron en amarillo.'), displayOrder: 37 },

  /* Qué hacer con este lead */
  {
    ...campo(GRUPO_DIAG, 'enumeration', 'select')(
      'alsai_diag_temperatura',
      'Prioridad del lead',
      'Calculada por el motor: combina el tamaño del impacto estimado con cuántas etapas salieron en rojo. Alta = llamar primero.',
      {
        options: [
          { label: '🔥 Alta — contactar hoy', value: 'alta', displayOrder: 0 },
          { label: '🟠 Media — contactar esta semana', value: 'media', displayOrder: 1 },
          { label: '🔵 Baja — nutrir', value: 'baja', displayOrder: 2 },
        ],
      },
    ),
    displayOrder: 40,
  },
  {
    ...campo(GRUPO_DIAG, 'enumeration', 'select')(
      'alsai_diag_solucion_1',
      'Solución prioritaria',
      'Módulo de servicio que el motor propone atacar primero, según las etapas en rojo.',
      { options: MODULOS },
    ),
    displayOrder: 41,
  },
  { ...dTexto('alsai_diag_soluciones', 'Soluciones sugeridas', 'Todos los módulos que aplican, en orden de prioridad.'), displayOrder: 42 },
  { ...dParrafo('alsai_diag_plan', 'Plan sugerido', 'Por qué se propone cada módulo y qué respuestas lo dispararon.'), displayOrder: 43 },

  /* Texto completo */
  { ...dParrafo('alsai_diag_respuestas', 'Respuestas del diagnóstico', 'Las 19 preguntas con su respuesta, en texto legible. Es el bloque que se le pasa a la IA.'), displayOrder: 50 },
];

/* ── Grupo 2 · Las 19 respuestas ──────────────────────────────────────── */

export const PROPIEDADES_RESPUESTAS = [
  pUnica(1, 'alsai_p01_tipo_clinica', 'P01 · Tipo de clínica',
    '¿Qué tipo de clínica es?',
    ['Clínica dental', 'Clínica de medicina estética', 'Clínica médica o de especialidad',
     'Clínica de belleza, spa o bienestar', 'Nutrición, rehabilitación o terapias',
     'Clínica multidisciplinaria', 'Otra']),

  pUnica(2, 'alsai_p02_capacidad_agenda', 'P02 · Cómo se comportó la agenda',
    'Durante las últimas cuatro semanas, ¿cómo se ha comportado la agenda de la clínica?',
    ['No tenemos esta información con claridad',
     'Tenemos muchos espacios disponibles la mayoría de los días',
     'La ocupación es irregular: algunos días se llenan y otros quedan vacíos',
     'Está casi llena, pero quedan huecos por cancelaciones o cambios',
     'Trabajamos cerca de nuestra capacidad máxima',
     'Tenemos lista de espera o demanda que no podemos atender']),

  pUnica(3, 'alsai_p03_personas_nuevas_mes', 'P03 · Personas nuevas al mes',
    'En los últimos 30 días, aproximadamente, ¿cuántas personas nuevas contactaron a la clínica para solicitar información, precios o una cita?',
    ['Menos de 5', 'Entre 5 y 10', 'Entre 10 y 15', 'Entre 15 y 25', 'Entre 25 y 50',
     'Entre 50 y 100', 'Más de 100', 'No lo sabemos']),

  pMulti(4, 'alsai_p04_canales_descubrimiento', 'P04 · Por dónde descubren la clínica',
    'Sus pacientes nuevos, ¿por dónde suelen descubrir la clínica? (hasta 3)',
    ['Recomendaciones de otros pacientes', 'Google o Google Maps',
     'Instagram, Facebook o TikTok', 'Anuncios pagados', 'Sitio web o búsquedas orgánicas',
     'Directorios, aseguradoras o plataformas externas', 'Alianzas o convenios',
     'Ubicación física de la clínica', 'No lo sabemos', 'Otro']),

  pMulti(5, 'alsai_p05_medios_contacto', 'P05 · Medios por los que piden informes',
    '¿Por qué medios suelen solicitar información?',
    ['WhatsApp', 'Llamada telefónica', 'Mensajes de Instagram o Facebook',
     'Formulario o chat del sitio web', 'Plataforma de citas', 'Correo electrónico', 'Otro']),

  pUnica(6, 'alsai_p06_inversion_publicidad', 'P06 · Inversión en publicidad',
    'Actualmente, ¿cuánto invierte aproximadamente la clínica en publicidad para atraer pacientes nuevos?',
    ['No invertimos; los pacientes llegan por recomendación u otros medios orgánicos',
     'Menos de $2,000 MXN al mes', 'Entre $2,000 y $5,000 MXN al mes',
     'Entre $5,000 y $20,000 MXN al mes', 'Más de $20,000 MXN al mes',
     'La inversión cambia considerablemente cada mes', 'No lo sabemos']),

  pUnica(7, 'alsai_p07_respuesta_en_horario', 'P07 · Tiempo de respuesta en horario',
    'Durante el horario de atención, ¿cuánto tarda normalmente una persona nueva en recibir una respuesta?',
    ['Menos de 5 minutos', 'Entre 5 y 15 minutos', 'Entre 16 y 60 minutos',
     'Entre 1 y 4 horas', 'Más de 4 horas, pero el mismo día',
     'El tiempo varía y algunas solicitudes pueden perderse', 'No lo medimos']),

  pUnica(8, 'alsai_p08_respuesta_fuera_horario', 'P08 · Tiempo de respuesta fuera de horario',
    'Si una persona nueva escribe fuera del horario de atención —por ejemplo, un sábado a las 9 de la noche—, ¿cuándo recibe una respuesta?',
    ['En minutos, aunque sea fuera del horario', 'Más tarde ese mismo día',
     'Durante el mismo fin de semana', 'Al comenzar el siguiente horario de atención',
     'Depende; algunas solicitudes pueden perderse', 'No lo medimos']),

  pEscala(9, 'alsai_p09_agendan_de_10', 'P09 · De cada 10 interesados, cuántos agendan',
    'De cada 10 personas nuevas que solicitan información, precios o una cita, ¿cuántas terminan agendando?'),

  pUnica(10, 'alsai_p10_seguimiento_no_agenda', 'P10 · Qué pasa con quien no agenda',
    '¿Qué sucede cuando una persona solicita información, pero no agenda en el primer contacto?',
    ['No tenemos forma de saberlo', 'Ya no se le vuelve a contactar',
     'Algunas veces recibe seguimiento y otras se pierde',
     'Normalmente recibe uno o dos mensajes manuales',
     'Una persona responsable le da seguimiento manual de forma consistente',
     'Entra en un proceso registrado con seguimiento automático y atención humana']),

  pUnica(11, 'alsai_p11_citas_mes', 'P11 · Citas programadas al mes',
    'Aproximadamente, ¿cuántas citas programa la clínica al mes?',
    ['Menos de 25', 'Entre 25 y 50', 'Entre 50 y 125', 'Entre 125 y 250', 'Más de 250',
     'No lo sabemos']),

  pEscala(12, 'alsai_p12_ausencias_de_10', 'P12 · De cada 10 citas, cuántas se pierden',
    'De cada 10 citas programadas, ¿cuántas se cancelan con tan poca anticipación que el espacio no puede recuperarse o no se presentan?'),

  pUnica(13, 'alsai_p13_valor_cita', 'P13 · Precio promedio de una cita',
    '¿Cuál es aproximadamente el precio promedio de una cita?',
    ['La valoración o primera consulta no tiene costo', 'Menos de $500 MXN',
     'Entre $500 y $1,000 MXN', 'Entre $1,000 y $2,500 MXN', 'Entre $2,500 y $5,000 MXN',
     'Entre $5,000 y $10,000 MXN', 'Más de $10,000 MXN',
     'Preferimos no responder o no lo sabemos']),

  pEscala(14, 'alsai_p14_avanzan_de_10', 'P14 · De cada 10 valoraciones, cuántas avanzan',
    'De cada 10 pacientes que asisten a una valoración y reciben una recomendación, cotización o plan de tratamiento, ¿cuántos avanzan con el tratamiento?'),

  pUnica(15, 'alsai_p15_tratamientos_pendientes', 'P15 · Qué pasa con el tratamiento no aceptado',
    'Cuando un paciente recibe una valoración, cotización o plan de tratamiento y no lo acepta o inicia ese día, ¿qué sucede?',
    ['No aplica a nuestro tipo de clínica', 'No existe un proceso definido',
     'Solo se retoma el contacto si el paciente vuelve a escribir',
     'Algunas veces se le da seguimiento y otras se pierde',
     'Normalmente recibe uno o dos mensajes manuales',
     'El equipo le da seguimiento manual mediante un proceso definido',
     'Recibe seguimiento combinado entre automatización y atención humana',
     'Queda registrado con etapa, responsable, próxima acción y seguimiento estructurado']),

  pUnica(16, 'alsai_p16_valor_tratamiento', 'P16 · Precio del tratamiento más frecuente',
    '¿Cuál es aproximadamente el precio del tratamiento, procedimiento o plan de servicios que la clínica vende con mayor frecuencia?',
    ['No aplica', 'Menos de $500 MXN', 'Entre $500 y $1,500 MXN', 'Entre $1,500 y $4,000 MXN',
     'Entre $4,000 y $7,500 MXN', 'Entre $7,500 y $12,500 MXN', 'Más de $12,500 MXN']),

  pUnica(17, 'alsai_p17_recuperacion_pacientes', 'P17 · Qué pasa con quien debería regresar',
    'Cuando un paciente debería regresar —por seguimiento, mantenimiento, revisión o una nueva sesión— y no lo hace, ¿qué sucede?',
    ['No aplica a nuestra operación',
     'No tenemos forma de saber qué pacientes deberían regresar',
     'La base de pacientes no está suficientemente organizada',
     'Normalmente no se le vuelve a contactar', 'Se le contacta solo en algunas ocasiones',
     'El equipo trabaja periódicamente una lista o campaña de recuperación',
     'Se detecta automáticamente y recibe comunicación según su tratamiento']),

  pUnica(18, 'alsai_p18_sistemas_conectados', 'P18 · Cómo están conectados sus sistemas',
    '¿Cómo están conectados actualmente WhatsApp, la agenda y la información de los pacientes?',
    ['No tenemos claridad sobre cómo se centraliza la información',
     'Utilizamos una agenda física o registros manuales',
     'Trabajamos principalmente con WhatsApp, calendarios u hojas de cálculo',
     'Utilizamos varios sistemas que no se comunican entre sí',
     'Tenemos software de citas, pero los mensajes y seguimientos están separados',
     'Todo está conectado y actualizado en un mismo sistema']),

  pMulti(19, 'alsai_p19_objetivo_90d', 'P19 · Objetivo a 90 días',
    '¿Qué resultado tendría mayor impacto para la clínica durante los próximos 90 días?',
    ['Atraer más pacientes adecuados', 'Convertir más solicitudes en citas',
     'Reducir cancelaciones y ausencias', 'Recuperar tratamientos o procedimientos pendientes',
     'Reactivar pacientes que dejaron de asistir', 'Liberar tiempo del equipo',
     'Tener mayor control y medición', 'Integrar la operación en un solo sistema',
     'Aumentar la capacidad de atención']),
];

export const GRUPOS = [
  { name: GRUPO_DIAG, label: 'Diagnóstico ALSAI', displayOrder: -1 },
  { name: GRUPO_RESP, label: 'Diagnóstico ALSAI · Respuestas', displayOrder: 0 },
];

export const TODAS = [...PROPIEDADES_DIAGNOSTICO, ...PROPIEDADES_RESPUESTAS];
