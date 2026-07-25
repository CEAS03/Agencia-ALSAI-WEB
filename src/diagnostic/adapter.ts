import { site } from '../config/site';
import { deliver } from './delivery';
import { DEMO_STEPS } from './demoScript';
import type { ResultadoDiagnostico, RespuestasCrudas } from './engine/scoring';
import { transcribirPlan } from './engine/soluciones';
import type {
  AgentInput,
  AgentReply,
  DiagnosticAdapter,
  LeadData,
  SessionMeta,
} from './types';

/**
 * Adaptador único del diagnóstico.
 *
 * — Las 19 preguntas SIEMPRE corren locales (guion fijo + motor de scoring
 *   en el navegador): cero latencia de red y ningún punto de falla a mitad
 *   del cuestionario.
 * — Al terminar, el paquete completo (lead + respuestas crudas + resultado
 *   + plan) sale por DOS caminos independientes:
 *     · `crmEndpoint` — función serverless del propio dominio que escribe en
 *       HubSpot. Es el registro que manda; el token nunca llega al navegador.
 *     · `n8nWebhookUrl` — copia para Sheets, correo y WhatsApp.
 *   Los dos pasan por `deliver()`, así que un fallo de red no pierde el lead:
 *   se reintenta y, si no, queda en la cola durable del navegador.
 *
 * Contrato del webhook documentado en INTEGRATION_N8N.md y el de HubSpot en
 * INTEGRATION_HUBSPOT.md.
 */

/**
 * Convierte las respuestas crudas en texto legible.
 * Se arma aquí porque es el cliente quien conoce los títulos de las
 * preguntas: el servidor solo recibe ids. Es el bloque que se guarda en
 * HubSpot y el que se le pasa a la IA.
 */
export function transcribirRespuestas(respuestas: RespuestasCrudas | undefined): string {
  if (!respuestas) return '';

  const formatear = (v: unknown): string => {
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return v;
    return '—';
  };

  const bloques: string[] = [];
  DEMO_STEPS.forEach((step, i) => {
    const dadas = respuestas[step.id];
    if (!dadas) return;

    const lineas = step.fields
      .map((campo) => {
        const valor = dadas[campo.id];
        if (valor === undefined || valor === '') return null;
        const prefijo = step.fields.length > 1 && campo.label ? `${campo.label}: ` : '';
        return `   ${prefijo}${formatear(valor)}`;
      })
      .filter(Boolean);

    if (lineas.length) bloques.push(`${i + 1}. ${step.title}\n${lineas.join('\n')}`);
  });

  return bloques.join('\n\n');
}
class LocalCaptureAdapter implements DiagnosticAdapter {
  private index = -1;
  private sessionId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  private meta: SessionMeta | null = null;
  /** Sirve para que n8n descarte envíos instantáneos: ningún humano
   *  responde 19 preguntas en segundos. */
  private startedAt = Date.now();

  constructor(
    private crmEndpoint: string,
    private webhookUrl: string,
  ) {}

  /** Pequeña latencia simulada: conserva el ritmo visual del análisis. */
  private latency<T>(value: T): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), 380 + Math.random() * 380));
  }

  /** Añade posición y total: alimentan la barra de progreso de la UI. */
  private question(i: number): AgentReply {
    return {
      kind: 'question',
      step: { ...DEMO_STEPS[i], index: i + 1, total: DEMO_STEPS.length },
    };
  }

  restorePosition(index: number): void {
    this.index = index;
  }

  startSession(meta: SessionMeta): Promise<{ sessionId: string }> {
    this.meta = meta;
    return this.latency({ sessionId: this.sessionId });
  }

  sendMessage(input: AgentInput): Promise<AgentReply> {
    if (input.type === 'begin') {
      this.index = 0;
      return this.latency<AgentReply>(this.question(0));
    }
    this.index += 1;
    if (this.index < DEMO_STEPS.length) {
      return this.latency<AgentReply>(this.question(this.index));
    }
    return this.latency<AgentReply>({ kind: 'lead' });
  }

  /**
   * Serializa el sobre común. `firma`, `hp` y `elapsed_ms` son las señales
   * que n8n usa para descartar envíos automatizados; ninguna es un secreto
   * real —el bundle es público— pero suben mucho el costo de spamear un
   * webhook abierto. `elapsed_ms` le sirve además a HubSpot para saber si el
   * prospecto contestó con calma o a la carrera.
   */
  private sobre(payload: Record<string, unknown>): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      source: this.meta?.source ?? 'sitio-web',
      enviado_en: new Date().toISOString(),
      firma: site.integrations.n8nWebhookToken,
      elapsed_ms: Date.now() - this.startedAt,
      ...payload,
    });
  }

  /**
   * Manda el mismo sobre a los dos destinos con la capa de entrega detrás.
   * Se lanzan en paralelo y se espera a los dos: son independientes, así que
   * n8n caído no impide registrar en HubSpot ni al revés. Devuelve `true` si
   * al menos uno llegó — el lead solo se da por perdido si fallan ambos, y
   * aun entonces queda encolado en el navegador.
   */
  private async repartir(payload: Record<string, unknown>): Promise<boolean> {
    const cuerpo = this.sobre(payload);
    const destinos = [this.crmEndpoint, this.webhookUrl].filter(Boolean);
    if (destinos.length === 0) return true; // modo demo: sin red configurada

    const resultados = await Promise.allSettled(destinos.map((url) => deliver(url, cuerpo)));
    return resultados.some((r) => r.status === 'fulfilled');
  }

  async submitLead(lead: LeadData, resultado?: ResultadoDiagnostico): Promise<{ ok: boolean }> {
    /* El honeypot viaja fuera de `lead`: los destinos reciben el contacto limpio. */
    const { hp, ...contacto } = lead;
    const ok = await this.repartir({
      type: 'lead',
      lead: contacto,
      hp: hp ?? '',
      meta: this.meta,
      resultado: resultado ?? null,
      respuestasTexto: transcribirRespuestas(resultado?.meta?.respuestas_crudas),
      planTexto: resultado ? transcribirPlan(resultado.plan) : '',
    });
    return { ok };
  }

  async requestMeeting(lead?: LeadData | null): Promise<{ ok: boolean }> {
    const contacto = lead ? (({ hp: _hp, ...rest }) => rest)(lead) : null;
    /* `hp` va SIEMPRE, aunque aquí no haya formulario: el filtro de n8n valida
       con tipado estricto y un `undefined` no pasa la comprobación de cadena
       vacía — la solicitud de reunión se descartaría en silencio. */
    const ok = await this.repartir({ type: 'meeting', lead: contacto, hp: '' });
    return { ok };
  }
}

/** Fábrica: la UI no sabe por dónde viaja la información. */
export function createDiagnosticAdapter(): DiagnosticAdapter {
  return new LocalCaptureAdapter(
    site.integrations.crmEndpoint,
    site.integrations.n8nWebhookUrl,
  );
}
