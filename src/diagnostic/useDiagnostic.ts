import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { track } from '../lib/analytics';
import { setEcoMode } from '../scene/ecosystem';
import { createDiagnosticAdapter } from './adapter';
import { flushOutbox, installUnloadFlush } from './delivery';
import { evaluarDiagnostico, type ResultadoDiagnostico } from './engine/scoring';
import { clearSnapshot, loadSnapshot, saveSnapshot } from './persistence';
import type { LeadData, QuestionPayload, StepAnswers } from './types';

export type DiagPhase =
  | 'welcome'
  | 'question'
  | 'analyzing'
  | 'resultado'
  | 'lead'
  | 'submitting'
  | 'ready';

export interface DiagnosticState {
  isOpen: boolean;
  originRect: DOMRect | null;
  phase: DiagPhase;
  step: QuestionPayload | null;
  /** Avance 0–1 para la barra de progreso. */
  progress: number;
  lastAnswer: string | null;
  analysisNote: string;
  error: string | null;
  busy: boolean;
  lead: LeadData | null;
  /**
   * true = el lead quedó capturado pero el webhook no confirmó la entrega.
   * Está en la cola durable y la pantalla final ofrece la salida por
   * WhatsApp. Nunca se le dice al usuario "listo" si no lo está.
   */
  deliveryPending: boolean;
  meeting: 'idle' | 'requesting' | 'done';
  /** Respuestas acumuladas por pregunta: alimentan el motor de scoring. */
  answers: Record<string, StepAnswers>;
  /** Resultado del motor; se calcula al terminar la última pregunta. */
  result: ResultadoDiagnostico | null;
}

const MIN_ANALYSIS_MS = 1400;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Máquina de estados del diagnóstico. Habla solo con el adaptador
 * (demo o n8n) y con la capa de analítica; la UI es puramente visual.
 */
export function useDiagnostic() {
  const adapter = useMemo(createDiagnosticAdapter, []);
  const sessionStarted = useRef(false);
  const startedTracked = useRef(false);

  const [state, setState] = useState<DiagnosticState>({
    isOpen: false,
    originRect: null,
    phase: 'welcome',
    step: null,
    progress: 0,
    lastAnswer: null,
    analysisNote: '',
    error: null,
    busy: false,
    lead: null,
    deliveryPending: false,
    meeting: 'idle',
    answers: {},
    result: null,
  });

  /* Rescate de leads de visitas anteriores: si un envío quedó en la cola
     durable (red caída, Railway dormido), entra en cuanto vuelve el usuario. */
  useEffect(() => {
    installUnloadFlush();
    void flushOutbox();
  }, []);

  const patch = useCallback((p: Partial<DiagnosticState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  /* ── Reanudar una sesión persistida (misma pestaña tras bloqueo/recarga) ── */
  useEffect(() => {
    const snap = loadSnapshot();
    if (!snap) return;
    const s = snap.state;
    // Etapas intermedias vuelven a su punto estable.
    const phase: DiagPhase =
      s.phase === 'analyzing' ? 'question' : s.phase === 'submitting' ? 'lead' : s.phase;
    if (phase === 'welcome') return;

    adapter.restorePosition?.(snap.demoIndex);
    sessionStarted.current = true;
    startedTracked.current = true;
    setEcoMode(phase === 'ready' ? 'success' : 'diagnostic');
    setState((prev) => ({
      ...prev,
      ...s,
      answers: s.answers ?? {},
      result: s.result ?? null,
      phase,
      isOpen: true,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Guardar en cada cambio relevante mientras el diagnóstico está abierto. */
  useEffect(() => {
    if (!state.isOpen || state.phase === 'welcome') return;
    saveSnapshot({
      state: {
        phase: state.phase,
        step: state.step,
        progress: state.progress,
        lastAnswer: state.lastAnswer,
        analysisNote: state.analysisNote,
        lead: state.lead,
        deliveryPending: state.deliveryPending,
        meeting: state.meeting,
        answers: state.answers,
        result: state.result,
      },
      demoIndex: state.step ? state.step.index - 1 : 999,
    });
  }, [
    state.isOpen,
    state.phase,
    state.step,
    state.progress,
    state.lastAnswer,
    state.analysisNote,
    state.lead,
    state.deliveryPending,
    state.meeting,
    state.answers,
    state.result,
  ]);

  const open = useCallback(
    (originRect: DOMRect | null) => {
      track('diagnostic_opened');
      setEcoMode('diagnostic');
      patch({ isOpen: true, originRect });
      if (!sessionStarted.current) {
        sessionStarted.current = true;
        adapter
          .startSession({
            startedAt: new Date().toISOString(),
            source: 'sitio-web',
            userAgent: navigator.userAgent,
          })
          .catch(() => {
            sessionStarted.current = false;
          });
      }
    },
    [adapter, patch],
  );

  const close = useCallback(() => {
    setEcoMode(state.phase === 'ready' ? 'success' : 'hero');
    clearSnapshot();
    patch({ isOpen: false });
  }, [patch, state.phase]);

  const begin = useCallback(async () => {
    if (!startedTracked.current) {
      startedTracked.current = true;
      track('diagnostic_start');
    }
    patch({ busy: true, error: null });
    try {
      const reply = await adapter.sendMessage({ type: 'begin' });
      if (reply.kind === 'question') {
        patch({
          phase: 'question',
          step: reply.step,
          progress: (reply.step.index - 1) / reply.step.total,
          busy: false,
        });
      } else {
        patch({ phase: 'lead', progress: 1, busy: false });
      }
    } catch {
      patch({ busy: false, error: 'No pudimos iniciar el análisis. Intenta de nuevo.' });
    }
  }, [adapter, patch]);

  /** `summary` es el texto que se muestra en la tarjeta de análisis. */
  const answer = useCallback(
    async (answers: StepAnswers, summary: string) => {
      const step = state.step;
      if (!step || state.phase !== 'question') return;

      const nextAnswers = { ...state.answers, [step.id]: answers };
      setEcoMode('analysis');
      patch({
        phase: 'analyzing',
        analysisNote: step.analysisNote,
        lastAnswer: summary,
        progress: step.index / step.total,
        error: null,
        answers: nextAnswers,
      });

      try {
        const [reply] = await Promise.all([
          adapter.sendMessage({ type: 'answer', stepId: step.id, answers }),
          delay(MIN_ANALYSIS_MS),
        ]);

        if (reply.kind === 'question') {
          setEcoMode('diagnostic');
          patch({ phase: 'question', step: reply.step });
        } else {
          // Fin del cuestionario: el motor local calcula el resultado inmediato.
          const result = evaluarDiagnostico(nextAnswers);
          track('diagnostic_complete', { modo: result.impacto.modo });
          setEcoMode('success');
          patch({ phase: 'resultado', step: null, progress: 1, result });
        }
      } catch {
        setEcoMode('diagnostic');
        patch({
          phase: 'question',
          progress: (step.index - 1) / step.total,
          error: 'Se perdió la conexión con el análisis. Elige tu respuesta otra vez.',
        });
      }
    },
    [adapter, patch, state.answers, state.phase, state.step],
  );

  /** CTA de la pantalla de resultados → captura de datos. */
  const continueToLead = useCallback(() => {
    track('routes_cta_clicked');
    setEcoMode('diagnostic');
    patch({ phase: 'lead' });
  }, [patch]);

  const submitLead = useCallback(
    async (lead: LeadData) => {
      patch({ phase: 'submitting', error: null });
      try {
        await adapter.submitLead(lead, state.result ?? undefined);
        /* Un solo evento por conversión: `diagnostic_complete` ya se emitió
           al calcular el resultado; aquí lo que ocurre es la captura del lead. */
        track('generate_lead', { origen: 'diagnostico', entrega: 'ok' });
        setEcoMode('success');
        patch({ phase: 'ready', lead, deliveryPending: false });
      } catch {
        /**
         * El envío falló tras los reintentos, pero el lead YA está en la cola
         * durable: se reintentará solo en la próxima visita. Bloquear aquí al
         * usuario sería lo peor posible —abandonaría y perderíamos el contacto
         * por ambos lados—, así que avanzamos y la pantalla final ofrece
         * WhatsApp como vía alterna, diciendo la verdad sobre el estado.
         */
        track('generate_lead', { origen: 'diagnostico', entrega: 'pendiente' });
        setEcoMode('success');
        patch({ phase: 'ready', lead, deliveryPending: true, error: null });
      }
    },
    [adapter, patch, state.result],
  );

  const requestMeeting = useCallback(async () => {
    patch({ meeting: 'requesting' });
    try {
      await adapter.requestMeeting(state.lead);
      track('schedule_call_click', { origen: 'diagnostico' });
      patch({ meeting: 'done' });
    } catch {
      patch({ meeting: 'idle', error: 'No pudimos registrar la solicitud. Intenta de nuevo.' });
    }
  }, [adapter, patch, state.lead]);

  return { state, open, close, begin, answer, continueToLead, submitLead, requestMeeting };
}

export type DiagnosticController = ReturnType<typeof useDiagnostic>;
