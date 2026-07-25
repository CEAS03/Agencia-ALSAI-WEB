/**
 * ─────────────────────────────────────────────────────────────────────────
 *  n8n · workflow "ALSAI · Diagnóstico web" (6ZVfaoWLxo7JSiGZ)
 *  Nodo Code «Preparar lead» — modo: Run Once for Each Item
 *
 *  Pegar este código TAL CUAL en la UI de n8n, reemplazando el actual.
 *  A mano y no por API: reescribir el workflow con el SDK le quita las
 *  credenciales a los nodos de Google y Gmail y rompe el flujo vivo.
 *
 *  Emite una fila con las 51 columnas de la hoja "Leads", en el mismo
 *  orden del encabezado, más `resumen_html` para el correo (la hoja lo
 *  ignora si el nodo de Sheets tiene "Handling extra data" = Ignore).
 * ─────────────────────────────────────────────────────────────────────────
 */

const body = $input.item.json.body ?? {};
const lead = body.lead ?? {};
const r = body.resultado ?? {};
const etapas = r.etapas ?? {};
const imp = r.impacto ?? {};
const meta = r.meta ?? {};
const plan = r.plan ?? {};
const cruda = meta.respuestas_crudas ?? {};

/* ── Las 19 respuestas ────────────────────────────────────────────────
 * Los ids son los del guion (src/diagnostic/demoScript.ts). El orden y
 * los nombres coinciden con las columnas p01…p19 de la hoja y con las
 * propiedades alsai_p01…alsai_p19 de HubSpot: los tres se mueven juntos. */
const P = [
  ['p01_tipo_clinica', 'q1-tipo', 'tipo', 'texto'],
  ['p02_capacidad_agenda', 'q2-agenda', 'capacidad', 'texto'],
  ['p03_personas_nuevas_mes', 'q3-volumen', 'volumen', 'texto'],
  ['p04_canales_descubrimiento', 'q4-origen', 'origen', 'lista'],
  ['p05_medios_contacto', 'q5-medios', 'medios', 'lista'],
  ['p06_inversion_publicidad', 'q6-publicidad', 'inversion', 'texto'],
  ['p07_respuesta_en_horario', 'q7-respuesta-dentro', 'dentro', 'texto'],
  ['p08_respuesta_fuera_horario', 'q8-respuesta-fuera', 'fuera', 'texto'],
  ['p09_agendan_de_10', 'q9-conversion-citas', 'conversion', 'escala'],
  ['p10_seguimiento_no_agenda', 'q10-seguimiento', 'seguimiento', 'texto'],
  ['p11_citas_mes', 'q11-citas', 'citas', 'texto'],
  ['p12_ausencias_de_10', 'q12-ausencias', 'ausencias', 'escala'],
  ['p13_valor_cita', 'q13-valor-cita', 'valorCita', 'texto'],
  ['p14_avanzan_de_10', 'q14-conversion-tratamiento', 'conversionTratamiento', 'escala'],
  ['p15_tratamientos_pendientes', 'q15-tratamientos-pendientes', 'pendientes', 'texto'],
  ['p16_valor_tratamiento', 'q16-valor-tratamiento', 'valorTratamiento', 'texto'],
  ['p17_recuperacion_pacientes', 'q17-recuperacion', 'recuperacion', 'texto'],
  ['p18_sistemas_conectados', 'q18-sistemas', 'sistemas', 'texto'],
  ['p19_objetivo_90d', 'q19-prioridad', 'prioridad', 'lista'],
];

const respuestas = {};
for (const [columna, paso, campo, forma] of P) {
  const v = (cruda[paso] ?? {})[campo];
  if (forma === 'escala') {
    // Solo el número. Si eligió una salida ("No lo sabemos") llega texto y
    // la celda se deja vacía: así se puede promediar la columna sin trampas.
    respuestas[columna] = typeof v === 'number' ? v : '';
  } else if (forma === 'lista') {
    // Mismo separador que HubSpot usa para valores múltiples.
    respuestas[columna] = Array.isArray(v) ? v.join(';') : '';
  } else {
    respuestas[columna] = typeof v === 'string' ? v : '';
  }
}

/* ── Semáforo e impacto ───────────────────────────────────────────────── */

const nombres = {
  captacion: 'Captación', respuesta: 'Respuesta', agenda: 'Agenda',
  asistencia: 'Asistencia', conversion: 'Tratamiento', recuperacion: 'Recuperación',
};
const emoji = { verde: '🟢', amarillo: '🟡', rojo: '🔴', gris: '⚪' };
const color = (k) => (etapas[k] ?? {}).color ?? '';

const cuenta = (c) => Object.values(etapas).filter((e) => e && e.color === c).length;

const fmt = (n) => (typeof n === 'number' ? '$' + n.toLocaleString('en-US') : '');
let cifra = 'Sin estimación (datos insuficientes)';
if (imp.modo === 'pesos') {
  cifra = fmt(imp.dinero_min) + ' a ' + fmt(imp.dinero_max) + ' MXN/mes (' + (imp.etiqueta ?? '') + ')';
}
if (imp.modo === 'volumen') {
  cifra = imp.volumen_min + ' a ' + imp.volumen_max + ' oportunidades de cita/mes';
}

const enPesos = imp.modo === 'pesos';

/* ── Fecha legible en horario de Querétaro ────────────────────────────── */

const iso = body.enviado_en ?? new Date().toISOString();
let fechaMx = '';
try {
  fechaMx = new Date(iso).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
} catch (e) {
  fechaMx = iso;
}

/* ── Correo para Carlos ───────────────────────────────────────────────── */

const lineasEtapas = Object.entries(etapas)
  .map(([k, v]) => (emoji[v.color] ?? '') + ' <b>' + (nombres[k] ?? k) + '</b>: ' + v.conclusion)
  .join('<br>');

const propuestas = (plan.recomendaciones ?? [])
  .map((x, i) => (i + 1) + '. <b>' + (x.nombre ?? '') + '</b> — ' + (x.motivo ?? ''))
  .join('<br>');

const desglose = (imp.desglose ?? [])
  .map((p) => '<b>' + p.nombre + '</b><br>' + p.calculo_bajo + '<br>' + p.calculo_alto)
  .join('<br><br>');

const resumenHtml = '<h2>Nuevo lead del diagnóstico</h2>'
  + '<p><b>' + (lead.name ?? '') + '</b> — ' + (lead.clinic ?? '') + '<br>'
  + 'WhatsApp: <a href="https://wa.me/52' + (lead.whatsapp ?? '') + '">' + (lead.whatsapp ?? '') + '</a><br>'
  + 'Correo: ' + (lead.email ?? '') + '<br>'
  + 'Tipo de clínica: ' + (meta.tipo_clinica ?? '') + '</p>'
  + '<p><b>Prioridad:</b> ' + String(plan.temperatura ?? '').toUpperCase()
  + ' — ' + (plan.motivo_temperatura ?? '') + '</p>'
  + '<p><b>Impacto estimado:</b> ' + cifra + '</p>'
  + '<h3>Qué proponerle</h3><p>' + (propuestas || '—') + '</p>'
  + '<p>' + lineasEtapas + '</p>'
  + '<h3>Desglose del cálculo</h3><p>' + (desglose || '—') + '</p>'
  + '<p><i>Sistemas actuales: ' + (meta.infraestructura ?? '') + '</i></p>';

const resumenTexto = resumenHtml
  .replace(/<br>/g, '\n')
  .replace(/<\/p>|<\/h2>|<\/h3>/g, '\n')
  .replace(/<[^>]+>/g, '');

/* ── La fila, en el orden exacto de la hoja ───────────────────────────── */

return {
  json: {
    // 1 · Contacto
    fecha_iso: iso,
    fecha_mx: fechaMx,
    nombre: lead.name ?? '',
    clinica: lead.clinic ?? '',
    whatsapp: lead.whatsapp ?? '',
    correo: (lead.email ?? '').toLowerCase(),
    consentimiento: lead.consent ? 'sí' : 'no',
    origen: body.source ?? 'sitio-web',
    duracion_min: typeof body.elapsed_ms === 'number'
      ? Number((body.elapsed_ms / 60000).toFixed(1))
      : '',
    session_id: body.sessionId ?? '',

    // 2 · Veredicto
    temperatura: plan.temperatura ?? '',
    solucion_prioritaria: (plan.recomendaciones ?? [])[0]
      ? plan.recomendaciones[0].modulo
      : '',
    soluciones_sugeridas: (plan.recomendaciones ?? [])
      .map((x) => x.nombre ?? x.modulo).join(' · '),
    cifra: cifra,
    modo_impacto: imp.modo ?? '',
    impacto_min: (enPesos ? imp.dinero_min : imp.volumen_min) ?? '',
    impacto_max: (enPesos ? imp.dinero_max : imp.volumen_max) ?? '',
    etapas_rojas: cuenta('rojo'),
    etapas_amarillas: cuenta('amarillo'),

    // 3 · Semáforo
    e1_captacion: color('captacion'),
    e2_respuesta: color('respuesta'),
    e3_agenda: color('agenda'),
    e4_asistencia: color('asistencia'),
    e5_conversion: color('conversion'),
    e6_recuperacion: color('recuperacion'),

    // 4 · Las 19 respuestas
    ...respuestas,

    // 5 · Texto completo
    transcripcion: body.respuestasTexto ?? '',
    plan_sugerido: body.planTexto ?? '',
    resumen_texto: resumenTexto,

    // 6 · Técnico
    palancas: (imp.palancas_usadas ?? []).join(', '),
    respuestas_json: JSON.stringify(cruda),
    resultado_json: JSON.stringify(r),
    user_agent: (meta && body.meta ? body.meta.userAgent : '') ?? '',

    // Solo para el correo; la hoja lo ignora.
    resumen_html: resumenHtml,
  },
};
