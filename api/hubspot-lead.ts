/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SITIO WEB → HUBSPOT (función serverless de Vercel)
 *
 *  Recibe el diagnóstico terminado y lo registra en HubSpot:
 *    · Contacto  — datos de la persona + resultado en propiedades filtrables
 *    · Empresa   — la clínica, asociada al contacto
 *    · Nota      — las 19 respuestas y el desglose del impacto, legibles
 *    · Negocio   — un deal en el pipeline con el impacto estimado
 *
 *  El token vive SOLO aquí (variable de entorno del servidor). Nunca viaja
 *  al navegador: por eso existe esta función y no se llama a HubSpot directo
 *  desde el cliente.
 *
 *  Variables de entorno (Vercel › Settings › Environment Variables):
 *    HUBSPOT_TOKEN        (obligatoria) token de app privada
 *    HUBSPOT_DEAL_STAGE   (opcional) id de la etapa inicial del negocio
 *    ALLOWED_ORIGIN       (opcional) origen permitido; por defecto el propio dominio
 * ─────────────────────────────────────────────────────────────────────────
 */

/* Tipos mínimos de la petición: evitan depender de @vercel/node. */
interface Req {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
  end(): void;
}

const API = 'https://api.hubapi.com';
const TOKEN = process.env.HUBSPOT_TOKEN ?? '';

/** IDs de asociación estándar de HubSpot (v4). */
const ASOC = {
  contactoAEmpresa: 1,
  negocioAContacto: 3,
  negocioAEmpresa: 5,
  notaAContacto: 202,
  notaAEmpresa: 190,
  notaANegocio: 214,
} as const;

interface LeadEntrante {
  name?: string;
  clinic?: string;
  whatsapp?: string;
  email?: string;
  consent?: boolean;
}

interface Recomendacion {
  modulo?: string;
  nombre?: string;
  prioridad?: number;
  motivo?: string;
  evidencia?: string[];
}
interface Plan {
  temperatura?: string;
  motivo_temperatura?: string;
  recomendaciones?: Recomendacion[];
}

interface Etapa { color?: string; conclusion?: string }
interface Impacto {
  modo?: string;
  dinero_min?: number;
  dinero_max?: number;
  volumen_min?: number;
  volumen_max?: number;
  etiqueta?: string;
  nota_total?: string;
  supuestos_aplicados?: string[];
}
/** Respuestas tal como las entrega el motor: stepId → { fieldId: valor }. */
type RespuestasCrudas = Record<string, Record<string, unknown>>;

interface Resultado {
  etapas?: Record<string, Etapa>;
  impacto?: Impacto;
  plan?: Plan;
  meta?: {
    tipo_clinica?: string;
    infraestructura?: string;
    objetivo_90d?: string[];
    respuestas_crudas?: RespuestasCrudas;
  };
}

interface Cuerpo {
  type?: string;
  sessionId?: string;
  source?: string;
  lead?: LeadEntrante;
  resultado?: Resultado | null;
  /** Transcripción legible que arma el cliente (tiene los títulos de las preguntas). */
  respuestasTexto?: string;
  /** Plan de soluciones en texto, también armado por el cliente. */
  planTexto?: string;
  /** Milisegundos entre la primera pregunta y el envío. */
  elapsed_ms?: number;
}

/* ── Las 19 preguntas → una propiedad cada una ────────────────────────
 *
 * `paso`/`campo` son los ids del guion (src/diagnostic/demoScript.ts) y
 * `prop` el nombre en HubSpot (scripts/hubspot-props.mjs). Los tres archivos
 * tienen que moverse juntos; por eso el orden y la numeración son literales
 * y no se calculan.
 *
 * Formas:
 *   'unica'  — una opción; se guarda el texto tal cual.
 *   'multi'  — varias; HubSpot las separa con ';'.
 *   'escala' — número 0–10; si eligió una salida ("No lo sabemos") se OMITE
 *              la propiedad y queda vacía, que en HubSpot se filtra con
 *              "is unknown". El texto de la salida vive en la transcripción.
 */
type FormaRespuesta = 'unica' | 'multi' | 'escala';

const MAPA_PREGUNTAS: Array<{ paso: string; campo: string; prop: string; forma: FormaRespuesta }> = [
  { paso: 'q1-tipo', campo: 'tipo', prop: 'alsai_p01_tipo_clinica', forma: 'unica' },
  { paso: 'q2-agenda', campo: 'capacidad', prop: 'alsai_p02_capacidad_agenda', forma: 'unica' },
  { paso: 'q3-volumen', campo: 'volumen', prop: 'alsai_p03_personas_nuevas_mes', forma: 'unica' },
  { paso: 'q4-origen', campo: 'origen', prop: 'alsai_p04_canales_descubrimiento', forma: 'multi' },
  { paso: 'q5-medios', campo: 'medios', prop: 'alsai_p05_medios_contacto', forma: 'multi' },
  { paso: 'q6-publicidad', campo: 'inversion', prop: 'alsai_p06_inversion_publicidad', forma: 'unica' },
  { paso: 'q7-respuesta-dentro', campo: 'dentro', prop: 'alsai_p07_respuesta_en_horario', forma: 'unica' },
  { paso: 'q8-respuesta-fuera', campo: 'fuera', prop: 'alsai_p08_respuesta_fuera_horario', forma: 'unica' },
  { paso: 'q9-conversion-citas', campo: 'conversion', prop: 'alsai_p09_agendan_de_10', forma: 'escala' },
  { paso: 'q10-seguimiento', campo: 'seguimiento', prop: 'alsai_p10_seguimiento_no_agenda', forma: 'unica' },
  { paso: 'q11-citas', campo: 'citas', prop: 'alsai_p11_citas_mes', forma: 'unica' },
  { paso: 'q12-ausencias', campo: 'ausencias', prop: 'alsai_p12_ausencias_de_10', forma: 'escala' },
  { paso: 'q13-valor-cita', campo: 'valorCita', prop: 'alsai_p13_valor_cita', forma: 'unica' },
  { paso: 'q14-conversion-tratamiento', campo: 'conversionTratamiento', prop: 'alsai_p14_avanzan_de_10', forma: 'escala' },
  { paso: 'q15-tratamientos-pendientes', campo: 'pendientes', prop: 'alsai_p15_tratamientos_pendientes', forma: 'unica' },
  { paso: 'q16-valor-tratamiento', campo: 'valorTratamiento', prop: 'alsai_p16_valor_tratamiento', forma: 'unica' },
  { paso: 'q17-recuperacion', campo: 'recuperacion', prop: 'alsai_p17_recuperacion_pacientes', forma: 'unica' },
  { paso: 'q18-sistemas', campo: 'sistemas', prop: 'alsai_p18_sistemas_conectados', forma: 'unica' },
  { paso: 'q19-prioridad', campo: 'prioridad', prop: 'alsai_p19_objetivo_90d', forma: 'multi' },
];

/**
 * HubSpot usa ';' para separar valores múltiples, así que un ';' dentro de
 * un valor lo partiría en dos. Misma transformación que en hubspot-props.mjs
 * al declarar las opciones: los dos lados coinciden siempre.
 */
const normalizarOpcion = (texto: string): string => texto.replace(/;/g, ',').trim();

/** Convierte las respuestas crudas en propiedades de HubSpot. */
export function propiedadesDeRespuestas(respuestas?: RespuestasCrudas): Record<string, string> {
  const props: Record<string, string> = {};
  if (!respuestas) return props;

  for (const { paso, campo, prop, forma } of MAPA_PREGUNTAS) {
    const valor = respuestas[paso]?.[campo];

    if (forma === 'escala') {
      /* Solo el número. Una salida llega como string y se deja vacía. */
      if (typeof valor === 'number' && Number.isFinite(valor)) props[prop] = String(valor);
      continue;
    }
    if (forma === 'multi') {
      if (Array.isArray(valor) && valor.length) {
        props[prop] = valor
          .filter((v): v is string => typeof v === 'string' && v !== '')
          .map(normalizarOpcion)
          .join(';');
      }
      continue;
    }
    if (typeof valor === 'string' && valor !== '') props[prop] = normalizarOpcion(valor);
  }

  return props;
}

/* ── Utilidades ──────────────────────────────────────────────────────── */

async function hs(path: string, init: RequestInit = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const txt = await res.text();
  let cuerpo: any = null;
  try { cuerpo = txt ? JSON.parse(txt) : null; } catch { cuerpo = { raw: txt }; }
  if (!res.ok) {
    // Se registra en los logs de Vercel, nunca se devuelve al navegador.
    console.error(`HubSpot ${init.method ?? 'GET'} ${path} → ${res.status}`, JSON.stringify(cuerpo));
    throw new Error(`hubspot_${res.status}`);
  }
  return cuerpo;
}

const limpiar = (v: unknown, max = 400): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

/** Deja solo dígitos y antepone +52 si viene un número mexicano de 10 dígitos. */
function normalizarTelefono(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 10) return `+52${d}`;
  if (d.startsWith('52') && d.length >= 12) return `+${d}`;
  return d.startsWith('+') ? d : `+${d}`;
}

function escaparHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Busca un contacto por email y, si no hay, por teléfono. */
async function buscarContacto(email: string, tel: string): Promise<string | null> {
  const intentos: Array<{ propertyName: string; value: string }> = [];
  if (email) intentos.push({ propertyName: 'email', value: email });
  if (tel) intentos.push({ propertyName: 'phone', value: tel });

  for (const filtro of intentos) {
    const r = await hs('/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: JSON.stringify({
        filterGroups: [{ filters: [{ ...filtro, operator: 'EQ' }] }],
        properties: ['email'],
        limit: 1,
      }),
    });
    if (r?.results?.length) return r.results[0].id as string;
  }
  return null;
}

async function buscarEmpresa(nombre: string): Promise<string | null> {
  if (!nombre) return null;
  const r = await hs('/crm/v3/objects/companies/search', {
    method: 'POST',
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'name', operator: 'EQ', value: nombre }] }],
      properties: ['name'],
      limit: 1,
    }),
  });
  return r?.results?.length ? (r.results[0].id as string) : null;
}

/** Primera etapa del primer pipeline de negocios, si no se configuró una. */
async function etapaInicialNegocio(): Promise<{ pipeline: string; stage: string } | null> {
  if (process.env.HUBSPOT_DEAL_STAGE && process.env.HUBSPOT_DEAL_PIPELINE) {
    return { pipeline: process.env.HUBSPOT_DEAL_PIPELINE, stage: process.env.HUBSPOT_DEAL_STAGE };
  }
  const r = await hs('/crm/v3/pipelines/deals');
  const pipeline = r?.results?.[0];
  if (!pipeline) return null;
  const etapas = [...(pipeline.stages ?? [])].sort(
    (a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  return etapas.length ? { pipeline: pipeline.id, stage: etapas[0].id } : null;
}

/** Construye el cuerpo HTML de la nota. */
function armarNota(cuerpo: Cuerpo): string {
  const { resultado, respuestasTexto, sessionId, source } = cuerpo;
  const imp = resultado?.impacto;
  const etapas = resultado?.etapas ?? {};
  const plan = resultado?.plan;

  const NOMBRES: Record<string, string> = {
    captacion: 'Captación', respuesta: 'Respuesta', agenda: 'Agenda',
    asistencia: 'Asistencia', conversion: 'Conversión', recuperacion: 'Recuperación',
  };
  const EMOJI: Record<string, string> = {
    verde: '🟢', amarillo: '🟡', rojo: '🔴', gris: '⚪',
  };

  const filas = Object.entries(etapas)
    .map(([clave, e]) =>
      `<li>${EMOJI[e?.color ?? 'gris'] ?? '⚪'} <b>${NOMBRES[clave] ?? clave}</b>: ${escaparHtml(e?.conclusion ?? '—')}</li>`)
    .join('');

  const supuestos = (imp?.supuestos_aplicados ?? [])
    .map((s) => `<li>${escaparHtml(s)}</li>`).join('');

  const URGENCIA: Record<number, string> = { 1: 'Urgente', 2: 'Mejorable', 3: 'Refuerzo' };
  const propuestas = (plan?.recomendaciones ?? [])
    .map((rec) => {
      const evidencia = (rec.evidencia ?? [])
        .map((e) => `<li>${escaparHtml(e)}</li>`).join('');
      return `<li><b>${escaparHtml(rec.nombre ?? rec.modulo ?? '')}</b> — ${URGENCIA[rec.prioridad ?? 3] ?? ''}<br>`
        + `${escaparHtml(rec.motivo ?? '')}`
        + (evidencia ? `<ul>${evidencia}</ul>` : '')
        + '</li>';
    })
    .join('');

  return [
    '<h2>Diagnóstico completado</h2>',
    plan?.temperatura
      ? `<p><b>Prioridad del lead:</b> ${escaparHtml(plan.temperatura.toUpperCase())} — ${escaparHtml(plan.motivo_temperatura ?? '')}</p>`
      : '',
    imp?.etiqueta ? `<p><b>Impacto estimado:</b> ${escaparHtml(imp.etiqueta)}</p>` : '',
    imp?.nota_total ? `<p><i>${escaparHtml(imp.nota_total)}</i></p>` : '',
    propuestas ? `<h3>Qué proponerle, en este orden</h3><ol>${propuestas}</ol>` : '',
    filas ? `<h3>Etapas del recorrido del paciente</h3><ul>${filas}</ul>` : '',
    supuestos ? `<h3>Supuestos aplicados</h3><ul>${supuestos}</ul>` : '',
    respuestasTexto
      ? `<h3>Las 19 respuestas</h3><pre style="white-space:pre-wrap">${escaparHtml(respuestasTexto)}</pre>`
      : '',
    `<hr/><p style="color:#666"><small>Origen: ${escaparHtml(source ?? 'sitio-web')} · Sesión: ${escaparHtml(sessionId ?? '—')}</small></p>`,
  ].filter(Boolean).join('');
}

/* ── Handler ─────────────────────────────────────────────────────────── */

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  if (!TOKEN) {
    console.error('HUBSPOT_TOKEN no está configurada en el entorno.');
    return res.status(500).json({ ok: false, error: 'sin_configurar' });
  }

  // Solo se acepta desde el propio sitio: evita que terceros usen el endpoint.
  const origen = String(req.headers.origin ?? '');
  const permitido = process.env.ALLOWED_ORIGIN ?? 'https://www.agencia-alsai.com';
  if (origen && origen !== permitido && !origen.startsWith('http://localhost')) {
    return res.status(403).json({ ok: false, error: 'origen_no_permitido' });
  }

  const cuerpo: Cuerpo = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as Cuerpo) ?? {};
  const lead = cuerpo.lead ?? {};

  const nombreCompleto = limpiar(lead.name, 120);
  const clinica = limpiar(lead.clinic, 200);
  const email = limpiar(lead.email, 160).toLowerCase();
  const telefono = normalizarTelefono(limpiar(lead.whatsapp, 40));

  if (!nombreCompleto || (!email && !telefono)) {
    return res.status(400).json({ ok: false, error: 'datos_insuficientes' });
  }

  const partes = nombreCompleto.split(/\s+/);
  const firstname = partes[0];
  const lastname = partes.slice(1).join(' ');

  try {
    /* ── Solicitud de reunión: solo deja rastro en el contacto ── */
    if (cuerpo.type === 'meeting') {
      const id = await buscarContacto(email, telefono);
      if (id) {
        await hs('/crm/v3/objects/notes', {
          method: 'POST',
          body: JSON.stringify({
            properties: {
              hs_timestamp: new Date().toISOString(),
              hs_note_body: '<p><b>El prospecto solicitó una reunión</b> desde el sitio web.</p>',
            },
            associations: [{
              to: { id },
              types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: ASOC.notaAContacto }],
            }],
          }),
        });
      }
      return res.status(200).json({ ok: true });
    }

    /* ── 1. Propiedades del diagnóstico ── */
    const r = cuerpo.resultado ?? undefined;
    const imp = r?.impacto;
    const etapas = r?.etapas ?? {};
    const enPesos = imp?.modo === 'pesos';
    const min = enPesos ? imp?.dinero_min : imp?.volumen_min;
    const max = enPesos ? imp?.dinero_max : imp?.volumen_max;
    const rojas = Object.values(etapas).filter((e) => e?.color === 'rojo').length;

    const amarillas = Object.values(etapas).filter((e) => e?.color === 'amarillo').length;
    const plan = r?.plan;

    const props: Record<string, string> = {
      firstname,
      email,
      phone: telefono,
      company: clinica,
      alsai_diag_fecha: new Date().toISOString(),
      alsai_diag_session: limpiar(cuerpo.sessionId, 80),
      alsai_diag_consentimiento: lead.consent ? 'true' : 'false',
      alsai_diag_etapas_rojas: String(rojas),
      alsai_diag_etapas_amarillas: String(amarillas),
    };
    if (lastname) props.lastname = lastname;
    if (telefono) props.mobilephone = telefono;
    /* Solo los dos orígenes declarados; cualquier otro valor rompería la lista. */
    const origen = cuerpo.source === 'tarjeta-nfc' ? 'tarjeta-nfc' : 'sitio-web';
    props.alsai_diag_origen = origen;
    if (typeof cuerpo.elapsed_ms === 'number' && cuerpo.elapsed_ms > 0) {
      props.alsai_diag_duracion_min = (cuerpo.elapsed_ms / 60000).toFixed(1);
    }
    if (r?.meta?.tipo_clinica) props.alsai_diag_tipo_clinica = limpiar(r.meta.tipo_clinica);
    if (r?.meta?.infraestructura) props.alsai_diag_infraestructura = limpiar(r.meta.infraestructura);
    if (r?.meta?.objetivo_90d?.length) props.alsai_diag_objetivo_90d = limpiar(r.meta.objetivo_90d.join(', '));
    if (imp?.modo) props.alsai_diag_impacto_modo = imp.modo;
    if (imp?.etiqueta) props.alsai_diag_impacto_etiqueta = limpiar(imp.etiqueta);
    if (typeof min === 'number') props.alsai_diag_impacto_min = String(min);
    if (typeof max === 'number') props.alsai_diag_impacto_max = String(max);
    if (imp?.palancas_usadas?.length) props.alsai_diag_palancas = imp.palancas_usadas.join(', ');
    if (cuerpo.respuestasTexto) props.alsai_diag_respuestas = limpiar(cuerpo.respuestasTexto, 60000);
    if (cuerpo.planTexto) props.alsai_diag_plan = limpiar(cuerpo.planTexto, 60000);
    if (plan?.temperatura) props.alsai_diag_temperatura = plan.temperatura;
    const recomendadas = (plan?.recomendaciones ?? []).filter((x) => x.modulo);
    if (recomendadas.length) {
      props.alsai_diag_solucion_1 = recomendadas[0].modulo as string;
      props.alsai_diag_soluciones = limpiar(recomendadas.map((x) => x.nombre ?? x.modulo).join(' · '));
    }
    for (const clave of ['captacion', 'respuesta', 'agenda', 'asistencia', 'conversion', 'recuperacion']) {
      const color = etapas[clave]?.color;
      if (color) props[`alsai_diag_etapa_${clave}`] = color;
    }

    /* Las 19 respuestas van en una escritura APARTE, a propósito.
     * Son propiedades de lista: si el guion cambia un texto y aquí llega un
     * valor que HubSpot no reconoce, rechaza la petición ENTERA. Separadas,
     * ese fallo se lleva las respuestas —que de todos modos siguen íntegras
     * en la transcripción y en la nota— pero nunca el contacto. */
    const propsRespuestas = propiedadesDeRespuestas(r?.meta?.respuestas_crudas);

    /* ── 2. Contacto (crear o actualizar) ── */
    const idExistente = await buscarContacto(email, telefono);
    const contactoId: string = idExistente
      ? (await hs(`/crm/v3/objects/contacts/${idExistente}`, {
          method: 'PATCH', body: JSON.stringify({ properties: props }),
        })).id
      : (await hs('/crm/v3/objects/contacts', {
          method: 'POST', body: JSON.stringify({ properties: props }),
        })).id;

    /* ── 2b. Las 19 respuestas ──
     * A partir de aquí todo es "mejor esfuerzo": el contacto ya está a salvo. */
    if (Object.keys(propsRespuestas).length) {
      try {
        await hs(`/crm/v3/objects/contacts/${contactoId}`, {
          method: 'PATCH',
          body: JSON.stringify({ properties: propsRespuestas }),
        });
      } catch (e) {
        console.error('No se pudieron guardar las 19 respuestas como propiedades:', e);
      }
    }

    /* ── 3. Empresa (la clínica) ── */
    let empresaId: string | null = null;
    if (clinica) {
      try {
        empresaId = await buscarEmpresa(clinica);
        if (!empresaId) {
          empresaId = (await hs('/crm/v3/objects/companies', {
            method: 'POST',
            body: JSON.stringify({
              properties: {
                name: clinica,
                city: 'Querétaro',
                country: 'México',
                ...(r?.meta?.tipo_clinica ? { description: `Tipo de clínica: ${r.meta.tipo_clinica}` } : {}),
              },
            }),
          })).id;
        }
        await hs(
          `/crm/v4/objects/contacts/${contactoId}/associations/companies/${empresaId}`,
          {
            method: 'PUT',
            body: JSON.stringify([
              { associationCategory: 'HUBSPOT_DEFINED', associationTypeId: ASOC.contactoAEmpresa },
            ]),
          },
        );
      } catch (e) {
        console.error('No se pudo registrar la empresa (el contacto sí quedó):', e);
      }
    }

    /* ── 4. Negocio ── */
    let negocioId: string | null = null;
    const etapaIni = await etapaInicialNegocio().catch(() => null);
    if (etapaIni) try {
      const asociaciones: unknown[] = [{
        to: { id: contactoId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: ASOC.negocioAContacto }],
      }];
      if (empresaId) {
        asociaciones.push({
          to: { id: empresaId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: ASOC.negocioAEmpresa }],
        });
      }
      negocioId = (await hs('/crm/v3/objects/deals', {
        method: 'POST',
        body: JSON.stringify({
          properties: {
            dealname: `Diagnóstico — ${clinica || nombreCompleto}`,
            pipeline: etapaIni.pipeline,
            dealstage: etapaIni.stage,
            ...(enPesos && typeof min === 'number' ? { amount: String(min) } : {}),
            /* El plan viaja también aquí: es lo primero que se ve al abrir
               el negocio, sin tener que bajar a las notas. */
            ...(cuerpo.planTexto ? { description: limpiar(cuerpo.planTexto, 4000) } : {}),
          },
          associations: asociaciones,
        }),
      })).id;
    } catch (e) {
      console.error('No se pudo crear el negocio (el contacto sí quedó):', e);
    }

    /* ── 5. Nota con el detalle ── */
    const asocNota: unknown[] = [{
      to: { id: contactoId },
      types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: ASOC.notaAContacto }],
    }];
    if (empresaId) {
      asocNota.push({
        to: { id: empresaId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: ASOC.notaAEmpresa }],
      });
    }
    if (negocioId) {
      asocNota.push({
        to: { id: negocioId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: ASOC.notaANegocio }],
      });
    }
    try {
      await hs('/crm/v3/objects/notes', {
        method: 'POST',
        body: JSON.stringify({
          properties: {
            hs_timestamp: new Date().toISOString(),
            hs_note_body: armarNota(cuerpo).slice(0, 65000),
          },
          associations: asocNota,
        }),
      });
    } catch (e) {
      console.error('No se pudo crear la nota (el contacto sí quedó):', e);
    }

    return res.status(200).json({ ok: true, contactoId });
  } catch (e) {
    console.error('Fallo al registrar en HubSpot:', e);
    // Mensaje genérico: no se filtra información de la cuenta al navegador.
    return res.status(502).json({ ok: false, error: 'crm_no_disponible' });
  }
}
