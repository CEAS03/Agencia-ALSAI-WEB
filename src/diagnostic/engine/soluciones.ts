import type { ColorEtapa, EtapaKey, Impacto, RespuestasCrudas } from './scoring';
import type { StepAnswers } from '../types';

/**
 * ── MOTOR DE SOLUCIONES ──────────────────────────────────────────────
 * Traduce el semáforo y las 19 respuestas en dos cosas accionables:
 *
 *   1. Qué módulos de servicio proponerle (los mismos seis de /soluciones),
 *      ordenados por urgencia y con la evidencia que los dispara.
 *   2. Qué tan caliente está el lead, para saber a quién llamar primero.
 *
 * Igual que el motor de scoring: función pura, determinística, sin IA y
 * sin red. Las mismas respuestas producen siempre el mismo plan. La IA se
 * usa después, para redactar — nunca para decidir qué se recomienda.
 *
 * Regla dura: ningún módulo aparece sin al menos una respuesta concreta
 * que lo justifique, y esa respuesta viaja en `evidencia`.
 */

/* ── ⚠️ DECISIONES DE NEGOCIO (Carlos) ─────────────────────────────────
 * Umbrales de la prioridad del lead. Editar solo aquí. */

/** Piso de impacto mensual (extremo bajo, MXN) para considerarlo prioridad alta. */
export const UMBRAL_ALTA_MXN = 20_000; // 👈 EDITAR
/** Piso para prioridad media. Por debajo, y sin etapas rojas, es nutrición. */
export const UMBRAL_MEDIA_MXN = 5_000; // 👈 EDITAR
/** Etapas en rojo que por sí solas justifican llamar hoy. */
export const ROJAS_PARA_ALTA = 3; // 👈 EDITAR

/* ── Contrato de salida ───────────────────────────────────────────── */

export type ModuloKey = 'captacion' | 'atencion' | 'crm' | 'agenda' | 'web' | 'datos';

/** 1 = hay fuga activa · 2 = mejorable · 3 = refuerzo o petición del cliente. */
export type Prioridad = 1 | 2 | 3;

export interface Recomendacion {
  modulo: ModuloKey;
  /** Nombre tal como aparece en /soluciones. */
  nombre: string;
  prioridad: Prioridad;
  /** Una frase: qué problema resuelve en ESTA clínica. */
  motivo: string;
  /** Las respuestas que lo dispararon, citadas literalmente. */
  evidencia: string[];
}

export type Temperatura = 'alta' | 'media' | 'baja';

export interface PlanSugerido {
  temperatura: Temperatura;
  /** Por qué se le asignó esa temperatura, en texto. */
  motivo_temperatura: string;
  /** Módulos propuestos, ya ordenados: el primero es por dónde empezar. */
  recomendaciones: Recomendacion[];
}

/** Nombre de cada módulo. Contrato con la página /soluciones. */
const NOMBRES: Record<ModuloKey, string> = {
  captacion: 'Captación y demanda',
  atencion: 'Atención inteligente',
  crm: 'CRM y proceso comercial',
  agenda: 'Agenda, seguimiento y recuperación',
  web: 'Experiencias web que convierten',
  datos: 'Automatización, datos y optimización',
};

/**
 * Desempate cuando dos módulos comparten prioridad. El orden es el del
 * embudo: primero se tapa la fuga más cercana al dinero ya ganado.
 */
const ORDEN_EMPATE: ModuloKey[] = ['atencion', 'crm', 'agenda', 'captacion', 'web', 'datos'];

/* ── Lectura de respuestas ───────────────────────────────────────────── */

const single = (r: RespuestasCrudas, stepId: string, fieldId: string): string | null => {
  const v = (r[stepId] as StepAnswers | undefined)?.[fieldId];
  return typeof v === 'string' && v !== '' ? v : null;
};

const multi = (r: RespuestasCrudas, stepId: string, fieldId: string): string[] => {
  const v = (r[stepId] as StepAnswers | undefined)?.[fieldId];
  return Array.isArray(v) ? v : [];
};

const scale = (r: RespuestasCrudas, stepId: string, fieldId: string): number | null => {
  const v = (r[stepId] as StepAnswers | undefined)?.[fieldId];
  return typeof v === 'number' ? v : null;
};

/** Cita una respuesta para el bloque de evidencia. */
const cita = (etiqueta: string, valor: string | number | null): string | null =>
  valor === null || valor === '' ? null : `${etiqueta}: ${valor}`;

const limpiar = (lista: Array<string | null>): string[] => lista.filter((x): x is string => x !== null);

/** Del color de la etapa a la urgencia del módulo que la atiende. */
function prioridadPorColor(color: ColorEtapa): Prioridad | null {
  if (color === 'rojo') return 1;
  if (color === 'amarillo') return 2;
  return null; // verde no necesita nada; gris se trata aparte (falta de medición)
}

/* ── Reglas ─────────────────────────────────────────────────────────── */

export function construirPlan(
  respuestas: RespuestasCrudas,
  colores: Record<EtapaKey, ColorEtapa>,
  impacto: Impacto,
): PlanSugerido {
  const propuestas = new Map<ModuloKey, Recomendacion>();

  /** Añade un módulo, o sube su urgencia si ya estaba propuesto por otra vía. */
  const proponer = (
    modulo: ModuloKey,
    prioridad: Prioridad,
    motivo: string,
    evidencia: string[],
  ): void => {
    const previa = propuestas.get(modulo);
    if (!previa) {
      propuestas.set(modulo, { modulo, nombre: NOMBRES[modulo], prioridad, motivo, evidencia });
      return;
    }
    /* Se queda el motivo de la razón más urgente y se acumula la evidencia. */
    const evidenciaUnida = [...new Set([...previa.evidencia, ...evidencia])];
    if (prioridad < previa.prioridad) {
      propuestas.set(modulo, { ...previa, prioridad, motivo, evidencia: evidenciaUnida });
    } else {
      propuestas.set(modulo, { ...previa, evidencia: evidenciaUnida });
    }
  };

  /* ── Atención inteligente — velocidad de respuesta ──
   * El gris cuenta aquí, y solo aquí: "no lo medimos" en las dos preguntas
   * de respuesta no es falta de dato, es la confesión de que nadie sabe
   * cuántas oportunidades se enfrían. Se propone, pero sin urgencia: no
   * podemos afirmar que haya fuga si no hay medición. */
  const pRespuesta = prioridadPorColor(colores.respuesta);
  const evidenciaRespuesta = limpiar([
    cita('P07 · Respuesta en horario', single(respuestas, 'q7-respuesta-dentro', 'dentro')),
    cita('P08 · Respuesta fuera de horario', single(respuestas, 'q8-respuesta-fuera', 'fuera')),
  ]);
  if (pRespuesta !== null) {
    proponer(
      'atencion',
      pRespuesta,
      colores.respuesta === 'rojo'
        ? 'Hay solicitudes que se enfrían antes de recibir respuesta, dentro o fuera del horario.'
        : 'La respuesta funciona, pero deja huecos donde un prospecto puede enfriarse.',
      evidenciaRespuesta,
    );
  } else if (colores.respuesta === 'gris') {
    proponer(
      'atencion',
      3,
      'No se mide el tiempo de respuesta: hoy no hay forma de saber cuántas oportunidades se enfrían esperando.',
      evidenciaRespuesta,
    );
  }

  /* ── CRM y proceso comercial — solicitudes que no cierran ── */
  const pAgenda = prioridadPorColor(colores.agenda);
  if (pAgenda !== null) {
    proponer(
      'crm',
      pAgenda,
      colores.agenda === 'rojo'
        ? 'Quien pregunta y no agenda en el primer contacto se pierde sin proceso que lo recupere.'
        : 'Parte de los interesados queda sin seguimiento consistente.',
      limpiar([
        cita('P09 · De cada 10 interesados agendan', scale(respuestas, 'q9-conversion-citas', 'conversion')),
        cita('P10 · Qué pasa con quien no agenda', single(respuestas, 'q10-seguimiento', 'seguimiento')),
      ]),
    );
  }
  const pConversion = prioridadPorColor(colores.conversion);
  if (pConversion !== null) {
    proponer(
      'crm',
      pConversion,
      colores.conversion === 'rojo'
        ? 'Hay planes de tratamiento propuestos que nadie retoma: es el dinero más cercano y más barato de recuperar.'
        : 'Hay tratamientos en pausa sin un proceso claro para retomarlos.',
      limpiar([
        cita('P14 · De cada 10 valoraciones avanzan', scale(respuestas, 'q14-conversion-tratamiento', 'conversionTratamiento')),
        cita('P15 · Tratamiento no aceptado', single(respuestas, 'q15-tratamientos-pendientes', 'pendientes')),
      ]),
    );
  }

  /* ── Agenda, seguimiento y recuperación — huecos y pacientes dormidos ── */
  const pAsistencia = prioridadPorColor(colores.asistencia);
  if (pAsistencia !== null) {
    proponer(
      'agenda',
      pAsistencia,
      colores.asistencia === 'rojo'
        ? 'Una parte importante de la agenda se vacía por cancelaciones tardías y ausencias.'
        : 'Se pierden citas por cancelaciones y ausencias que podrían reducirse con recordatorios.',
      limpiar([
        cita('P12 · De cada 10 citas se pierden', scale(respuestas, 'q12-ausencias', 'ausencias')),
        cita('P11 · Citas al mes', single(respuestas, 'q11-citas', 'citas')),
      ]),
    );
  }
  const pRecuperacion = prioridadPorColor(colores.recuperacion);
  if (pRecuperacion !== null) {
    proponer(
      'agenda',
      pRecuperacion,
      colores.recuperacion === 'rojo'
        ? 'La base de pacientes que debería regresar está inactiva: ingreso recurrente sin trabajar.'
        : 'Se reactivan pacientes solo a ratos; falta un proceso periódico.',
      limpiar([
        cita('P17 · Qué pasa con quien debería regresar', single(respuestas, 'q17-recuperacion', 'recuperacion')),
      ]),
    );
  }

  /* ── Captación y demanda — entran pocos, o por un solo canal ── */
  const pCaptacion = prioridadPorColor(colores.captacion);
  if (pCaptacion !== null) {
    const canales = multi(respuestas, 'q4-origen', 'origen').filter((c) => c !== 'No lo sabemos');
    proponer(
      'captacion',
      pCaptacion,
      colores.captacion === 'rojo'
        ? 'Llegan muy pocas personas nuevas: el crecimiento se frena desde el inicio del embudo.'
        : canales.length <= 1
          ? 'La captación depende de un solo canal: si ese canal falla, el mes se cae.'
          : 'La captación funciona pero es difícil de predecir mes a mes.',
      limpiar([
        cita('P03 · Personas nuevas al mes', single(respuestas, 'q3-volumen', 'volumen')),
        cita('P04 · Canales', canales.length ? canales.join(', ') : null),
        cita('P06 · Inversión en publicidad', single(respuestas, 'q6-publicidad', 'inversion')),
      ]),
    );
  }

  /* ── Experiencias web que convierten ──
   * Se propone cuando la clínica no aparece en su propio sitio: ni la
   * descubren por ahí ni le escriben por ahí. No es una etapa del semáforo,
   * es un canal ausente, así que nunca sube de prioridad 2. */
  const origen = multi(respuestas, 'q4-origen', 'origen');
  const medios = multi(respuestas, 'q5-medios', 'medios');
  const sinWebEnOrigen = !origen.includes('Sitio web o búsquedas orgánicas');
  const sinWebEnMedios = !medios.includes('Formulario o chat del sitio web');
  if (sinWebEnOrigen && sinWebEnMedios) {
    proponer(
      'web',
      colores.captacion === 'rojo' ? 2 : 3,
      'El sitio web no aparece ni entre los canales de descubrimiento ni entre los medios de contacto: hoy no participa en la captación.',
      limpiar([
        cita('P04 · Canales', origen.length ? origen.join(', ') : 'sin dato'),
        cita('P05 · Medios de contacto', medios.length ? medios.join(', ') : 'sin dato'),
      ]),
    );
  }

  /* ── Automatización, datos y optimización ──
   * Dos disparadores distintos: la infraestructura está partida, o la
   * clínica no puede medirse (varias etapas en gris). */
  const sistemas = single(respuestas, 'q18-sistemas', 'sistemas');
  const objetivos = multi(respuestas, 'q19-prioridad', 'prioridad');
  const sistemasRotos =
    sistemas === 'No tenemos claridad sobre cómo se centraliza la información' ||
    sistemas === 'Utilizamos una agenda física o registros manuales' ||
    sistemas === 'Utilizamos varios sistemas que no se comunican entre sí' ||
    sistemas === 'Trabajamos principalmente con WhatsApp, calendarios u hojas de cálculo' ||
    sistemas === 'Tenemos software de citas, pero los mensajes y seguimientos están separados';
  const grises = (Object.keys(colores) as EtapaKey[]).filter((k) => colores[k] === 'gris').length;
  const quiereIntegrar =
    objetivos.includes('Integrar la operación en un solo sistema') ||
    objetivos.includes('Tener mayor control y medición');

  if (sistemasRotos || grises >= 2 || quiereIntegrar) {
    proponer(
      'datos',
      sistemasRotos && grises >= 2 ? 2 : 3,
      grises >= 2
        ? 'Faltan datos básicos de la operación: sin medición no se puede saber qué mejora y qué no.'
        : sistemasRotos
          ? 'La información vive en sistemas que no se hablan entre sí; el equipo paga esa costura todos los días.'
          : 'Es lo que la clínica pidió como objetivo de los próximos 90 días.',
      limpiar([
        cita('P18 · Sistemas', sistemas),
        cita('P19 · Objetivo a 90 días', objetivos.length ? objetivos.join(', ') : null),
        grises > 0 ? `Etapas sin datos: ${grises} de 6` : null,
      ]),
    );
  }

  /* ── Orden final ── */
  const recomendaciones = [...propuestas.values()].sort(
    (a, b) =>
      a.prioridad - b.prioridad ||
      ORDEN_EMPATE.indexOf(a.modulo) - ORDEN_EMPATE.indexOf(b.modulo),
  );

  return { ...calcularTemperatura(colores, impacto), recomendaciones };
}

/* ── Prioridad del lead ─────────────────────────────────────────────── */

function calcularTemperatura(
  colores: Record<EtapaKey, ColorEtapa>,
  impacto: Impacto,
): { temperatura: Temperatura; motivo_temperatura: string } {
  const rojas = (Object.keys(colores) as EtapaKey[]).filter((k) => colores[k] === 'rojo').length;
  const dinero = impacto.modo === 'pesos' ? (impacto.dinero_min ?? 0) : 0;
  const razones: string[] = [];

  if (rojas >= ROJAS_PARA_ALTA) razones.push(`${rojas} de 6 etapas en rojo`);
  else if (rojas > 0) razones.push(`${rojas} etapa${rojas > 1 ? 's' : ''} en rojo`);

  if (impacto.modo === 'pesos') razones.push(`fuga recuperable desde $${dinero.toLocaleString('en-US')} MXN al mes`);
  else if (impacto.modo === 'volumen') razones.push('impacto medible en citas, sin precios declarados');
  else razones.push('sin datos suficientes para estimar el impacto');

  const temperatura: Temperatura =
    rojas >= ROJAS_PARA_ALTA || dinero >= UMBRAL_ALTA_MXN
      ? 'alta'
      : rojas > 0 || dinero >= UMBRAL_MEDIA_MXN || impacto.modo === 'volumen'
        ? 'media'
        : 'baja';

  return { temperatura, motivo_temperatura: razones.join(' · ') };
}

/* ── Presentación ───────────────────────────────────────────────────── */

const ETIQUETA_PRIORIDAD: Record<Prioridad, string> = {
  1: 'Urgente',
  2: 'Mejorable',
  3: 'Refuerzo',
};

/**
 * Plan en texto plano. Es lo que se guarda en HubSpot y lo que se le pasa
 * a la IA junto con la transcripción de las 19 respuestas.
 */
export function transcribirPlan(plan: PlanSugerido): string {
  if (plan.recomendaciones.length === 0) {
    return 'Sin módulos propuestos: el diagnóstico no detectó fugas atendibles con la información recibida.';
  }
  const cabecera = `Prioridad del lead: ${plan.temperatura.toUpperCase()} (${plan.motivo_temperatura})`;
  const cuerpo = plan.recomendaciones.map((r, i) => {
    const evidencia = r.evidencia.map((e) => `     · ${e}`).join('\n');
    return `${i + 1}. ${r.nombre} — ${ETIQUETA_PRIORIDAD[r.prioridad]}\n   ${r.motivo}${evidencia ? `\n   Evidencia:\n${evidencia}` : ''}`;
  });
  return `${cabecera}\n\n${cuerpo.join('\n\n')}`;
}
