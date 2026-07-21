import { site } from '../config/site';
import { DEMO_STEPS } from './demoScript';
import type { ResultadoDiagnostico } from './engine/scoring';
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
 * — Con `VITE_N8N_WEBHOOK_URL` configurado, el paquete final (lead +
 *   respuestas crudas + resultado del motor) se envía a n8n al terminar,
 *   igual que la solicitud de reunión. Sin webhook: modo demo, sin red.
 *
 * Contrato del webhook documentado en INTEGRATION_N8N.md.
 */
class LocalCaptureAdapter implements DiagnosticAdapter {
  private index = -1;
  private sessionId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  private meta: SessionMeta | null = null;

  constructor(private webhookUrl: string) {}

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

  private async post(payload: Record<string, unknown>): Promise<void> {
    const res = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.sessionId,
        source: this.meta?.source ?? 'sitio-web',
        enviado_en: new Date().toISOString(),
        ...payload,
      }),
    });
    if (!res.ok) throw new Error(`n8n webhook: ${res.status}`);
  }

  async submitLead(lead: LeadData, resultado?: ResultadoDiagnostico): Promise<{ ok: boolean }> {
    if (!this.webhookUrl) return this.latency({ ok: true });
    await this.post({ type: 'lead', lead, meta: this.meta, resultado: resultado ?? null });
    return { ok: true };
  }

  async requestMeeting(lead?: LeadData | null): Promise<{ ok: boolean }> {
    if (!this.webhookUrl) return this.latency({ ok: true });
    await this.post({ type: 'meeting', lead: lead ?? null });
    return { ok: true };
  }
}

/** Fábrica: la UI no sabe si hay webhook o no. */
export function createDiagnosticAdapter(): DiagnosticAdapter {
  return new LocalCaptureAdapter(site.integrations.n8nWebhookUrl);
}
