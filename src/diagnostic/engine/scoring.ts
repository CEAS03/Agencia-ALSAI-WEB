import type { StepAnswers } from '../types';

/**
 * ── MOTOR DE SCORING DEL DIAGNÓSTICO ─────────────────────────────────
 * Función pura y determinística: las mismas 19 respuestas producen
 * siempre el mismo resultado. Sin IA, sin red, sin dependencias.
 *
 * Convierte las respuestas en:
 *   1. Color de cada etapa del recorrido del paciente.
 *   2. Conclusión corta de plantilla por etapa.
 *   3. Estimación económica (o de volumen) en rango — nunca cifra exacta.
 *
 * Regla dura: ningún número sale de aquí sin derivarse de una respuesta
 * real mediante las fórmulas documentadas. Los supuestos aplicados se
 * declaran explícitos en `impacto.supuestos_aplicados`.
 */

/* ── ⚠️ DECISIONES DE NEGOCIO (Carlos) ─────────────────────────────────
 * Las tres constantes que calibran la estimación. Editar solo aquí. */

/** Fracción de la fuga que un buen sistema puede recuperar. No subir de 0.50. */
export const RECOVERY = { bajo: 0.2, alto: 0.4 }; // 👈 EDITAR

/**
 * Fracción de las citas atendidas que son valoraciones que terminan en un
 * plan/cotización. Único supuesto del modelo (0 = desactiva la Palanca C).
 */
export const VALORACION_RATE = 0.7; // 👈 EDITAR

/**
 * "recuperable" = fuga × RECOVERY (conservador, recomendado para venta).
 * "fuga_total"  = la fuga completa (más contundente, más agresivo).
 */
export const PRESENTACION: 'recuperable' | 'fuga_total' = 'recuperable'; // 👈 EDITAR

/* ── Contrato de salida ───────────────────────────────────────────── */

export type ColorEtapa = 'verde' | 'amarillo' | 'rojo' | 'gris';

export type EtapaKey =
  | 'captacion'
  | 'respuesta'
  | 'agenda'
  | 'asistencia'
  | 'conversion'
  | 'recuperacion';

export interface Etapa {
  color: ColorEtapa;
  conclusion: string;
}

export type Palanca = 'A' | 'B' | 'C';

/** Un dato usado en una fórmula: de qué pregunta salió y en qué número se convirtió. */
export interface DatoDesglose {
  etiqueta: string;
  /** La respuesta literal del cliente (o "supuesto" cuando no viene de una pregunta). */
  respuesta: string;
  valor: string;
}

/** Desglose transparente de una palanca: fórmula + datos + cálculo con números. */
export interface PalancaDesglose {
  id: Palanca;
  nombre: string;
  formula: string;
  datos: DatoDesglose[];
  calculo_bajo: string;
  calculo_alto: string;
}

export interface Impacto {
  modo: 'pesos' | 'volumen' | 'insuficiente';
  /** Solo en modo pesos: rango mensual redondeado en MXN. */
  dinero_min?: number;
  dinero_max?: number;
  /** Solo en modo volumen: oportunidades de cita al mes. */
  volumen_min?: number;
  volumen_max?: number;
  /** Etiqueta que SIEMPRE coincide con el cálculo aplicado. */
  etiqueta: string;
  palancas_usadas: Palanca[];
  supuestos_aplicados: string[];
  /** Desglose "Ver fórmulas": una entrada por palanca usada. */
  desglose: PalancaDesglose[];
  /** Suma de las palancas + redondeo aplicado, en texto. */
  nota_total: string;
  /** Aclaraciones de plantilla sobre los supuestos del cálculo. */
  notas: string[];
}

/** Respuestas crudas tal como las entrega la UI: stepId → { fieldId: valor }. */
export type RespuestasCrudas = Record<string, StepAnswers>;

export interface ResultadoDiagnostico {
  etapas: Record<EtapaKey, Etapa>;
  impacto: Impacto;
  meta: {
    tipo_clinica: string;
    infraestructura: string;
    objetivo_90d: string[];
    respuestas_crudas: RespuestasCrudas;
  };
}

/* ── Lectura de respuestas (ids del guion de 19 preguntas) ──────────── */

function single(r: RespuestasCrudas, stepId: string, fieldId: string): string | null {
  const v = r[stepId]?.[fieldId];
  return typeof v === 'string' && v !== '' ? v : null;
}

function multi(r: RespuestasCrudas, stepId: string, fieldId: string): string[] {
  const v = r[stepId]?.[fieldId];
  return Array.isArray(v) ? v : [];
}

/** Escala 0–10: número entero, o `null` si eligió una salida ("No lo sabemos"…). */
function scale(r: RespuestasCrudas, stepId: string, fieldId: string): number | null {
  const v = r[stepId]?.[fieldId];
  return typeof v === 'number' ? v : null;
}

/** La salida elegida en una escala, si la hubo. */
function scaleEscape(r: RespuestasCrudas, stepId: string, fieldId: string): string | null {
  const v = r[stepId]?.[fieldId];
  return typeof v === 'string' ? v : null;
}

/* ── Buckets → rangos numéricos [bajo, alto] ─────────────────────────
 * Los buckets abiertos ("Más de…") usan el piso: no se infla. */

type Rango = readonly [number, number];

const RANGO_Q3: Record<string, Rango | null> = {
  'Menos de 5': [1, 4],
  'Entre 5 y 10': [5, 10],
  'Entre 10 y 15': [10, 15],
  'Entre 15 y 25': [15, 25],
  'Entre 25 y 50': [25, 50],
  'Entre 50 y 100': [50, 100],
  'Más de 100': [100, 100],
  'No lo sabemos': null,
};

/** Orden de los buckets de Q3 para comparaciones tipo "Q3 ≥ Entre 15 y 25". */
const ORDEN_Q3 = [
  'Menos de 5',
  'Entre 5 y 10',
  'Entre 10 y 15',
  'Entre 15 y 25',
  'Entre 25 y 50',
  'Entre 50 y 100',
  'Más de 100',
];

const RANGO_Q11: Record<string, Rango | null> = {
  'Menos de 25': [10, 24],
  'Entre 25 y 50': [25, 50],
  'Entre 50 y 125': [50, 125],
  'Entre 125 y 250': [125, 250],
  'Más de 250': [250, 250],
  'No lo sabemos': null,
};

/** Q13. La valoración sin costo es 0 (válido pero no monetiza la palanca). */
const RANGO_Q13: Record<string, Rango | 0 | null> = {
  'La valoración o primera consulta no tiene costo': 0,
  'Menos de $500 MXN': [300, 499],
  'Entre $500 y $1,000 MXN': [500, 1000],
  'Entre $1,000 y $2,500 MXN': [1000, 2500],
  'Entre $2,500 y $5,000 MXN': [2500, 5000],
  'Entre $5,000 y $10,000 MXN': [5000, 10000],
  'Más de $10,000 MXN': [10000, 10000],
  'Preferimos no responder o no lo sabemos': null,
};

const RANGO_Q16: Record<string, Rango | null> = {
  'No aplica': null,
  'Menos de $500 MXN': [300, 499],
  'Entre $500 y $1,500 MXN': [500, 1500],
  'Entre $1,500 y $4,000 MXN': [1500, 4000],
  'Entre $4,000 y $7,500 MXN': [4000, 7500],
  'Entre $7,500 y $12,500 MXN': [7500, 12500],
  'Más de $12,500 MXN': [12500, 12500],
};

/* ── Conclusiones cortas de plantilla: [etapa][color] ───────────────── */

const CONCLUSIONES: Record<EtapaKey, Record<ColorEtapa, string>> = {
  captacion: {
    verde: 'Flujo saludable de personas nuevas, con más de un canal activo.',
    amarillo: 'La captación funciona, pero depende de pocos canales o es difícil de predecir.',
    rojo: 'Llegan muy pocas personas nuevas al mes: el crecimiento se frena desde el inicio.',
    gris: 'Sin datos del volumen de personas nuevas; es la primera métrica a medir.',
  },
  respuesta: {
    verde: 'Responden en minutos, incluso fuera de horario: pocas oportunidades se enfrían.',
    amarillo: 'La respuesta es razonable, pero hay huecos donde un prospecto puede enfriarse.',
    rojo: 'Respuesta tardía: algunos prospectos podrían enfriarse antes de recibir atención.',
    gris: 'Sin medición del tiempo de respuesta, dentro ni fuera de horario.',
  },
  agenda: {
    verde: 'La mayoría de quienes preguntan agendan, y quien no agenda recibe seguimiento.',
    amarillo: 'Se agendan citas, pero parte de los interesados queda sin seguimiento consistente.',
    rojo: 'Pocas solicitudes se convierten en cita, o no hay seguimiento a quien no agenda.',
    gris: 'Sin datos de cuántas solicitudes terminan en cita.',
  },
  asistencia: {
    verde: 'Las cancelaciones y ausencias están bajo control.',
    amarillo: 'Algunas citas se pierden por cancelaciones o ausencias que podrían reducirse.',
    rojo: 'Una parte importante de las citas se cancela o no llega: agenda que se queda vacía.',
    gris: 'Sin datos de cancelaciones y ausencias.',
  },
  conversion: {
    verde: 'La mayoría de las valoraciones avanzan y los planes pendientes reciben seguimiento.',
    amarillo: 'Hay tratamientos propuestos que se quedan en pausa sin un proceso para retomarlos.',
    rojo: 'Muchos planes de tratamiento no se concretan y no existe un proceso para recuperarlos.',
    gris: 'No aplica para este tipo de clínica, o faltan datos de conversión a tratamiento.',
  },
  recuperacion: {
    verde: 'Existe un proceso activo para hacer volver a los pacientes que deberían regresar.',
    amarillo: 'Se reactivan pacientes solo en algunas ocasiones: hay ingreso recurrente sin trabajar.',
    rojo: 'Los pacientes que deberían regresar no reciben contacto: la base está inactiva.',
    gris: 'No aplica para esta operación, o faltan datos de reactivación.',
  },
};

/* ── Reglas de color por etapa ──────────────────────────────────────── */

function colorCaptacion(r: RespuestasCrudas): ColorEtapa {
  const q3 = single(r, 'q3-volumen', 'volumen');
  if (q3 === null || q3 === 'No lo sabemos') return 'gris';
  if (q3 === 'Menos de 5') return 'rojo';

  // Canales reales de descubrimiento: "No lo sabemos" no cuenta como canal.
  const canales = multi(r, 'q4-origen', 'origen').filter((c) => c !== 'No lo sabemos').length;
  const q6 = single(r, 'q6-publicidad', 'inversion');
  const q6Inestable =
    q6 === 'No invertimos; los pacientes llegan por recomendación u otros medios orgánicos' ||
    q6 === 'La inversión cambia considerablemente cada mes' ||
    q6 === 'No lo sabemos';

  if (q3 === 'Entre 5 y 10' || canales === 1 || q6Inestable) return 'amarillo';
  if (ORDEN_Q3.indexOf(q3) >= ORDEN_Q3.indexOf('Entre 15 y 25') && canales >= 2) return 'verde';
  return 'amarillo';
}

function colorRespuesta(r: RespuestasCrudas): ColorEtapa {
  const q7 = single(r, 'q7-respuesta-dentro', 'dentro');
  const q8 = single(r, 'q8-respuesta-fuera', 'fuera');
  if ((q7 === 'No lo medimos' || q7 === null) && (q8 === 'No lo medimos' || q8 === null)) {
    return 'gris';
  }

  const q7Rojo =
    q7 === 'Más de 4 horas, pero el mismo día' ||
    q7 === 'El tiempo varía y algunas solicitudes pueden perderse' ||
    q7 === 'No lo medimos';
  const q8Rojo =
    q8 === 'Depende; algunas solicitudes pueden perderse' ||
    q8 === 'Al comenzar el siguiente horario de atención' ||
    q8 === 'No lo medimos';
  if (q7Rojo || q8Rojo) return 'rojo';

  if (
    (q7 === 'Menos de 5 minutos' || q7 === 'Entre 5 y 15 minutos') &&
    q8 === 'En minutos, aunque sea fuera del horario'
  ) {
    return 'verde';
  }
  return 'amarillo';
}

function colorAgenda(r: RespuestasCrudas): ColorEtapa {
  const q9 = scale(r, 'q9-conversion-citas', 'conversion');
  if (q9 === null) return 'gris';

  const q10 = single(r, 'q10-seguimiento', 'seguimiento');
  if (q9 <= 3 || q10 === 'No tenemos forma de saberlo' || q10 === 'Ya no se le vuelve a contactar') {
    return 'rojo';
  }
  if (
    q9 >= 7 &&
    (q10 === 'Una persona responsable le da seguimiento manual de forma consistente' ||
      q10 === 'Entra en un proceso registrado con seguimiento automático y atención humana')
  ) {
    return 'verde';
  }
  return 'amarillo';
}

function colorAsistencia(r: RespuestasCrudas): ColorEtapa {
  const q12 = scale(r, 'q12-ausencias', 'ausencias');
  if (q12 === null) return 'gris';
  if (q12 >= 4) return 'rojo';
  if (q12 >= 2) return 'amarillo';
  return 'verde';
}

function colorConversion(r: RespuestasCrudas): ColorEtapa {
  const q14 = scale(r, 'q14-conversion-tratamiento', 'conversionTratamiento');
  const q14Esc = scaleEscape(r, 'q14-conversion-tratamiento', 'conversionTratamiento');
  const q15 = single(r, 'q15-tratamientos-pendientes', 'pendientes');
  if (q14Esc === 'No aplica a nuestro tipo de clínica' || q15 === 'No aplica a nuestro tipo de clínica') {
    return 'gris';
  }

  if (
    (q14 !== null && q14 <= 3) ||
    q15 === 'No existe un proceso definido' ||
    q15 === 'Solo se retoma el contacto si el paciente vuelve a escribir'
  ) {
    return 'rojo';
  }
  if (
    q14 !== null &&
    q14 >= 7 &&
    (q15 === 'El equipo le da seguimiento manual mediante un proceso definido' ||
      q15 === 'Recibe seguimiento combinado entre automatización y atención humana' ||
      q15 === 'Queda registrado con etapa, responsable, próxima acción y seguimiento estructurado')
  ) {
    return 'verde';
  }
  return 'amarillo';
}

function colorRecuperacion(r: RespuestasCrudas): ColorEtapa {
  const q17 = single(r, 'q17-recuperacion', 'recuperacion');
  if (q17 === null || q17 === 'No aplica a nuestra operación') return 'gris';
  if (
    q17 === 'No tenemos forma de saber qué pacientes deberían regresar' ||
    q17 === 'La base de pacientes no está suficientemente organizada' ||
    q17 === 'Normalmente no se le vuelve a contactar'
  ) {
    return 'rojo';
  }
  if (q17 === 'Se le contacta solo en algunas ocasiones') return 'amarillo';
  return 'verde';
}

/* ── Impacto económico: 3 palancas de fuga secuenciales ──────────────
 * A (pregunta y no agenda) + B (agenda y no asiste) + C (asiste y no
 * cierra tratamiento) son momentos distintos del embudo: sumarlas no
 * duplica pacientes. Todo se propaga como rango [bajo, alto]. */

interface PalancaCalc {
  id: Palanca;
  /** Oportunidades de cita al mes (sin monetizar). */
  volumen: Rango | null;
  /** Pesos MXN al mes, ya multiplicados por la banda de presentación. */
  pesos: Rango | null;
  desglosePesos: PalancaDesglose | null;
  desgloseVolumen: PalancaDesglose | null;
}

function mul(a: Rango, b: Rango): Rango {
  return [a[0] * b[0], a[1] * b[1]];
}

function escalar(a: Rango, k: number): Rango {
  return [a[0] * k, a[1] * k];
}

/* Formato determinístico (sin depender del locale del entorno). */

function miles(n: number): string {
  const fijo = Number.isInteger(n) ? String(n) : n.toFixed(1);
  const [ent, dec] = fijo.split('.');
  const conComas = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec ? `${conComas}.${dec}` : conComas;
}

const fmtMXN = (n: number): string => `$${miles(Math.round(n))}`;
const pct = (f: number): string => `${Math.round(f * 100)}%`;
/* "=" cuando lo mostrado es exacto; "≈" cuando hubo redondeo al mostrarlo. */
const eqMXN = (n: number): string => (Math.abs(n - Math.round(n)) < 1e-9 ? '=' : '≈');
const eqNum = (n: number): string => (Math.abs(n - Number(n.toFixed(1))) < 1e-9 ? '=' : '≈');

/** Entradas numéricas del modelo + la respuesta literal de la que salió cada una. */
interface Entradas {
  q3: Rango | null;
  q3Texto: string | null;
  q9: number | null;
  q11: Rango | null;
  q11Texto: string | null;
  q12: number | null;
  q13: Rango | 0 | null;
  q13Texto: string | null;
  q14: number | null;
  q16: Rango | null;
  q16Texto: string | null;
}

function leerEntradas(r: RespuestasCrudas): Entradas {
  const q3Texto = single(r, 'q3-volumen', 'volumen');
  const q11Texto = single(r, 'q11-citas', 'citas');
  const q13Texto = single(r, 'q13-valor-cita', 'valorCita');
  const q16Texto = single(r, 'q16-valor-tratamiento', 'valorTratamiento');
  return {
    q3: RANGO_Q3[q3Texto ?? ''] ?? null,
    q3Texto,
    q9: scale(r, 'q9-conversion-citas', 'conversion'),
    q11: RANGO_Q11[q11Texto ?? ''] ?? null,
    q11Texto,
    q12: scale(r, 'q12-ausencias', 'ausencias'),
    q13: RANGO_Q13[q13Texto ?? ''] ?? null,
    q13Texto,
    q14: scale(r, 'q14-conversion-tratamiento', 'conversionTratamiento'),
    q16: RANGO_Q16[q16Texto ?? ''] ?? null,
    q16Texto,
  };
}

function calcularPalancas(r: RespuestasCrudas): PalancaCalc[] {
  const e = leerEntradas(r);
  // Banda de presentación: conservadora (RECOVERY) o fuga completa.
  const recuperable = PRESENTACION === 'recuperable';
  const banda: Rango = recuperable ? [RECOVERY.bajo, RECOVERY.alto] : [1, 1];
  /** Factor "% recuperable" de las fórmulas; vacío en modo fuga completa. */
  const fRec = recuperable ? ' × % recuperable' : '';
  const xRec = (lado: 0 | 1) => (recuperable ? ` × ${pct(banda[lado])}` : '');

  const datoQ3 = (): DatoDesglose => ({
    etiqueta: 'Q3 · Personas nuevas que contactan al mes',
    respuesta: e.q3Texto ?? '',
    valor: `${miles((e.q3 as Rango)[0])} a ${miles((e.q3 as Rango)[1])} personas`,
  });
  const datoQ9 = (): DatoDesglose => ({
    etiqueta: 'Q9 · De cada 10 interesados, cuántos agendan',
    respuesta: String(e.q9),
    valor: `no agenda el ${pct((10 - (e.q9 as number)) / 10)}`,
  });
  const datoQ11 = (): DatoDesglose => ({
    etiqueta: 'Q11 · Citas programadas al mes',
    respuesta: e.q11Texto ?? '',
    valor: `${miles((e.q11 as Rango)[0])} a ${miles((e.q11 as Rango)[1])} citas`,
  });
  const datoQ12 = (): DatoDesglose => ({
    etiqueta: 'Q12 · De cada 10 citas, cuántas se pierden',
    respuesta: String(e.q12),
    valor: `se pierde el ${pct((e.q12 as number) / 10)}`,
  });
  const datoQ13 = (): DatoDesglose => ({
    etiqueta: 'Q13 · Precio promedio de una cita',
    respuesta: e.q13Texto ?? '',
    valor: `${fmtMXN((e.q13 as Rango)[0])} a ${fmtMXN((e.q13 as Rango)[1])} por cita`,
  });

  // ── Palanca A — prospectos que preguntan pero no agendan ──
  const volA = e.q3 !== null && e.q9 !== null ? escalar(e.q3, (10 - e.q9) / 10) : null;
  // Q13 = 0 (valoración sin costo) o null: A no monetiza, queda en volumen.
  const pesosA =
    volA !== null && e.q13 !== null && e.q13 !== 0 ? mul(mul(volA, e.q13), banda) : null;

  let desgloseA: PalancaDesglose | null = null;
  let desgloseVolA: PalancaDesglose | null = null;
  if (volA !== null) {
    const fugaA = (10 - (e.q9 as number)) / 10;
    const nombre = 'Palanca A · Personas que preguntan y no agendan';
    desgloseVolA = {
      id: 'A',
      nombre,
      formula: 'personas nuevas × % que no agenda',
      datos: [datoQ3(), datoQ9()],
      calculo_bajo: `Mínimo: ${miles((e.q3 as Rango)[0])} × ${pct(fugaA)} ${eqNum(volA[0])} ${miles(volA[0])} citas`,
      calculo_alto: `Máximo: ${miles((e.q3 as Rango)[1])} × ${pct(fugaA)} ${eqNum(volA[1])} ${miles(volA[1])} citas`,
    };
    if (pesosA !== null) {
      const q13r = e.q13 as Rango;
      desgloseA = {
        id: 'A',
        nombre,
        formula: `personas nuevas × % que no agenda × valor de la cita${fRec}`,
        datos: [datoQ3(), datoQ9(), datoQ13()],
        calculo_bajo: `Mínimo: ${miles((e.q3 as Rango)[0])} × ${pct(fugaA)} × ${fmtMXN(q13r[0])}${xRec(0)} ${eqMXN(pesosA[0])} ${fmtMXN(pesosA[0])}`,
        calculo_alto: `Máximo: ${miles((e.q3 as Rango)[1])} × ${pct(fugaA)} × ${fmtMXN(q13r[1])}${xRec(1)} ${eqMXN(pesosA[1])} ${fmtMXN(pesosA[1])}`,
      };
    }
  }

  // ── Palanca B — citas canceladas / no-show ──
  const volB = e.q11 !== null && e.q12 !== null ? escalar(e.q11, e.q12 / 10) : null;
  const pesosB =
    volB !== null && e.q13 !== null && e.q13 !== 0 ? mul(mul(volB, e.q13), banda) : null;

  let desgloseB: PalancaDesglose | null = null;
  let desgloseVolB: PalancaDesglose | null = null;
  if (volB !== null) {
    const fugaB = (e.q12 as number) / 10;
    const nombre = 'Palanca B · Citas canceladas o que no se presentan';
    desgloseVolB = {
      id: 'B',
      nombre,
      formula: 'citas del mes × % que se pierde',
      datos: [datoQ11(), datoQ12()],
      calculo_bajo: `Mínimo: ${miles((e.q11 as Rango)[0])} × ${pct(fugaB)} ${eqNum(volB[0])} ${miles(volB[0])} citas`,
      calculo_alto: `Máximo: ${miles((e.q11 as Rango)[1])} × ${pct(fugaB)} ${eqNum(volB[1])} ${miles(volB[1])} citas`,
    };
    if (pesosB !== null) {
      const q13r = e.q13 as Rango;
      desgloseB = {
        id: 'B',
        nombre,
        formula: `citas del mes × % que se pierde × valor de la cita${fRec}`,
        datos: [datoQ11(), datoQ12(), datoQ13()],
        calculo_bajo: `Mínimo: ${miles((e.q11 as Rango)[0])} × ${pct(fugaB)} × ${fmtMXN(q13r[0])}${xRec(0)} ${eqMXN(pesosB[0])} ${fmtMXN(pesosB[0])}`,
        calculo_alto: `Máximo: ${miles((e.q11 as Rango)[1])} × ${pct(fugaB)} × ${fmtMXN(q13r[1])}${xRec(1)} ${eqMXN(pesosB[1])} ${fmtMXN(pesosB[1])}`,
      };
    }
  }

  // ── Palanca C — tratamientos no cerrados (usa el supuesto VALORACION_RATE) ──
  const atendidas = e.q11 !== null && e.q12 !== null ? escalar(e.q11, 1 - e.q12 / 10) : null;
  const volC =
    atendidas !== null && e.q14 !== null ? escalar(atendidas, (10 - e.q14) / 10) : null;
  const pesosC =
    atendidas !== null && e.q14 !== null && e.q16 !== null && VALORACION_RATE > 0
      ? mul(mul(escalar(atendidas, VALORACION_RATE * ((10 - e.q14) / 10)), e.q16), banda)
      : null;

  let desgloseC: PalancaDesglose | null = null;
  let desgloseVolC: PalancaDesglose | null = null;
  if (volC !== null) {
    const fugaC = (10 - (e.q14 as number)) / 10;
    const at = atendidas as Rango;
    const nombre = 'Palanca C · Tratamientos propuestos sin cerrar';
    const datoAtendidas: DatoDesglose = {
      etiqueta: 'Citas que sí se presentan (Q11 × asistencia de Q12)',
      respuesta: '—',
      valor: `${miles(at[0])} a ${miles(at[1])} citas atendidas`,
    };
    const datoQ14: DatoDesglose = {
      etiqueta: 'Q14 · De cada 10 valoraciones, cuántas avanzan',
      respuesta: String(e.q14),
      valor: `no avanza el ${pct(fugaC)}`,
    };
    desgloseVolC = {
      id: 'C',
      nombre,
      formula: 'citas atendidas × % que no avanza a tratamiento',
      datos: [datoQ11(), datoQ12(), datoAtendidas, datoQ14],
      calculo_bajo: `Mínimo: ${miles(at[0])} × ${pct(fugaC)} ${eqNum(volC[0])} ${miles(volC[0])} tratamientos`,
      calculo_alto: `Máximo: ${miles(at[1])} × ${pct(fugaC)} ${eqNum(volC[1])} ${miles(volC[1])} tratamientos`,
    };
    if (pesosC !== null) {
      const q16r = e.q16 as Rango;
      desgloseC = {
        id: 'C',
        nombre,
        formula: `citas atendidas × % con propuesta × % que no avanza × valor del tratamiento${fRec}`,
        datos: [
          datoQ11(),
          datoQ12(),
          datoAtendidas,
          {
            etiqueta: 'Supuesto · Citas atendidas que reciben propuesta o cotización',
            respuesta: 'supuesto del modelo (no viene de una pregunta)',
            valor: pct(VALORACION_RATE),
          },
          datoQ14,
          {
            etiqueta: 'Q16 · Precio del tratamiento más frecuente',
            respuesta: e.q16Texto ?? '',
            valor: `${fmtMXN(q16r[0])} a ${fmtMXN(q16r[1])} por tratamiento`,
          },
        ],
        calculo_bajo: `Mínimo: ${miles(at[0])} × ${pct(VALORACION_RATE)} × ${pct(fugaC)} × ${fmtMXN(q16r[0])}${xRec(0)} ${eqMXN(pesosC[0])} ${fmtMXN(pesosC[0])}`,
        calculo_alto: `Máximo: ${miles(at[1])} × ${pct(VALORACION_RATE)} × ${pct(fugaC)} × ${fmtMXN(q16r[1])}${xRec(1)} ${eqMXN(pesosC[1])} ${fmtMXN(pesosC[1])}`,
      };
    }
  }

  return [
    { id: 'A', volumen: volA, pesos: pesosA, desglosePesos: desgloseA, desgloseVolumen: desgloseVolA },
    { id: 'B', volumen: volB, pesos: pesosB, desglosePesos: desgloseB, desgloseVolumen: desgloseVolB },
    { id: 'C', volumen: volC, pesos: pesosC, desglosePesos: desgloseC, desgloseVolumen: desgloseVolC },
  ];
}

/** Redondeo anti-falsa-precisión: bajo hacia abajo, alto hacia arriba. */
function redondearPesos(v: number, dir: 'abajo' | 'arriba'): number {
  const paso = v < 10000 ? 500 : 1000;
  return dir === 'abajo' ? Math.floor(v / paso) * paso : Math.ceil(v / paso) * paso;
}

function calcularImpacto(r: RespuestasCrudas): Impacto {
  const palancas = calcularPalancas(r);
  const conPesos = palancas.filter((p) => p.pesos !== null);
  const conVolumen = palancas.filter((p) => p.volumen !== null);

  if (conPesos.length > 0) {
    const bajo = conPesos.reduce((s, p) => s + (p.pesos as Rango)[0], 0);
    const alto = conPesos.reduce((s, p) => s + (p.pesos as Rango)[1], 0);
    const dineroMin = redondearPesos(bajo, 'abajo');
    const dineroMax = redondearPesos(alto, 'arriba');
    const supuestos: string[] = [];
    const notas: string[] = [];
    if (PRESENTACION === 'recuperable') {
      supuestos.push(`RECOVERY=${RECOVERY.bajo}-${RECOVERY.alto}`);
      notas.push(
        `Mostramos solo la parte recuperable: un buen sistema suele rescatar entre el ${pct(RECOVERY.bajo)} y el ${pct(RECOVERY.alto)} de la fuga, no el 100%.`,
      );
    }
    if (conPesos.some((p) => p.id === 'C')) {
      supuestos.push(`VALORACION_RATE=${VALORACION_RATE}`);
      notas.push(
        `El único dato que no sale de tus respuestas es el ${pct(VALORACION_RATE)} de citas atendidas que reciben una propuesta; todo lo demás viene de lo que nos contaste.`,
      );
    }
    return {
      modo: 'pesos',
      dinero_min: dineroMin,
      dinero_max: dineroMax,
      etiqueta:
        PRESENTACION === 'recuperable'
          ? 'Oportunidad que un sistema podría recuperar'
          : 'Oportunidad que hoy no se está aprovechando',
      palancas_usadas: conPesos.map((p) => p.id),
      supuestos_aplicados: supuestos,
      desglose: conPesos.map((p) => p.desglosePesos as PalancaDesglose),
      nota_total: `Suma de las palancas: ${fmtMXN(bajo)} a ${fmtMXN(alto)} → mostramos ${fmtMXN(dineroMin)} a ${fmtMXN(dineroMax)} (el bajo se redondea hacia abajo y el alto hacia arriba para no aparentar una precisión que no existe).`,
      notas,
    };
  }

  if (conVolumen.length > 0) {
    const bajo = conVolumen.reduce((s, p) => s + (p.volumen as Rango)[0], 0);
    const alto = conVolumen.reduce((s, p) => s + (p.volumen as Rango)[1], 0);
    const volMin = Math.floor(bajo);
    const volMax = Math.ceil(alto);
    return {
      modo: 'volumen',
      volumen_min: volMin,
      volumen_max: volMax,
      etiqueta: 'Oportunidades de cita detectadas cada mes',
      palancas_usadas: conVolumen.map((p) => p.id),
      supuestos_aplicados: [],
      desglose: conVolumen.map((p) => p.desgloseVolumen as PalancaDesglose),
      nota_total: `Suma de las palancas: ${miles(bajo)} a ${miles(alto)} oportunidades → mostramos ${volMin} a ${volMax} al mes.`,
      notas: [
        'Sin el precio de tus citas o tratamientos preferimos no hablar de dinero: contamos oportunidades reales de cita.',
      ],
    };
  }

  return {
    modo: 'insuficiente',
    etiqueta: 'Con la información disponible aún no podemos estimar el impacto; lo afinamos contigo.',
    palancas_usadas: [],
    supuestos_aplicados: [],
    desglose: [],
    nota_total: '',
    notas: [],
  };
}

/* ── Punto de entrada del motor ─────────────────────────────────────── */

export function evaluarDiagnostico(respuestas: RespuestasCrudas): ResultadoDiagnostico {
  const colores: Record<EtapaKey, ColorEtapa> = {
    captacion: colorCaptacion(respuestas),
    respuesta: colorRespuesta(respuestas),
    agenda: colorAgenda(respuestas),
    asistencia: colorAsistencia(respuestas),
    conversion: colorConversion(respuestas),
    recuperacion: colorRecuperacion(respuestas),
  };

  const etapas = Object.fromEntries(
    (Object.keys(colores) as EtapaKey[]).map((k) => [
      k,
      { color: colores[k], conclusion: CONCLUSIONES[k][colores[k]] },
    ]),
  ) as Record<EtapaKey, Etapa>;

  return {
    etapas,
    impacto: calcularImpacto(respuestas),
    meta: {
      tipo_clinica: single(respuestas, 'q1-tipo', 'tipo') ?? '',
      infraestructura: single(respuestas, 'q18-sistemas', 'sistemas') ?? '',
      objetivo_90d: multi(respuestas, 'q19-prioridad', 'prioridad'),
      respuestas_crudas: respuestas,
    },
  };
}
