/** Contratos del diagnóstico — compartidos por la UI y los adaptadores. */

import type { ResultadoDiagnostico } from './engine/scoring';

export type FieldKind = 'single' | 'multi' | 'scale';

export interface StepField {
  id: string;
  kind: FieldKind;
  /** Etiqueta del campo. Necesaria cuando la pantalla tiene más de uno. */
  label?: string;
  /** Opciones para 'single' y 'multi'. */
  options?: string[];
  /** Máximo de opciones seleccionables ('multi'). Sin límite si se omite. */
  maxSelect?: number;
  /** Salidas de la escala 0–10, p. ej. ["No lo sabemos"]. */
  escapes?: string[];
}

export type FieldValue = string | string[] | number;
export type StepAnswers = Record<string, FieldValue>;

export interface QuestionPayload {
  id: string;
  /** Pregunta principal de la pantalla. */
  title: string;
  /** Texto aclaratorio opcional. */
  note?: string;
  fields: StepField[];
  /** Micro-copy del estado de análisis. */
  analysisNote: string;
  /** Posición (1-based) y total: alimentan la barra de progreso. */
  index: number;
  total: number;
}

export type AgentReply =
  | { kind: 'question'; step: QuestionPayload }
  | { kind: 'lead' }
  | { kind: 'result'; summary?: string };

export interface LeadData {
  name: string;
  clinic: string;
  whatsapp: string;
  email: string;
  consent: boolean;
  /**
   * Honeypot: campo oculto que una persona nunca ve ni llena. Si llega con
   * contenido, el envío viene de un bot y n8n lo descarta. No es dato del
   * lead, por eso el adaptador lo saca de `lead` antes de enviarlo.
   */
  hp?: string;
}

export interface SessionMeta {
  startedAt: string;
  source: string;
  userAgent: string;
}

export type AgentInput =
  | { type: 'begin' }
  | { type: 'answer'; stepId: string; answers: StepAnswers };

/**
 * Interfaz única de integración. La UI solo conoce este contrato:
 * cambiar del modo demo al agente real de n8n no toca ningún componente.
 */
export interface DiagnosticAdapter {
  startSession(meta: SessionMeta): Promise<{ sessionId: string }>;
  sendMessage(input: AgentInput): Promise<AgentReply>;
  /** `resultado` es el objeto del motor de scoring, listo para HubSpot/WhatsApp. */
  submitLead(lead: LeadData, resultado?: ResultadoDiagnostico): Promise<{ ok: boolean }>;
  /** `lead` permite correlacionar la solicitud con el contacto ya capturado. */
  requestMeeting(lead?: LeadData | null): Promise<{ ok: boolean }>;
  /** Reposiciona el adaptador al reanudar una sesión persistida. */
  restorePosition?(index: number): void;
}
