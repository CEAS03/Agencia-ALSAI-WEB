import { useEffect, useMemo, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../lib/useReveal';
import type { DemoScript, EventKind } from './demoScripts';

/**
 * Demo real (momento firma): pantalla dividida con la conversación de
 * WhatsApp a la izquierda y el sistema reaccionando a la derecha.
 * Autoavance de ~3 s con controles de pausa, retroceso, avance y reinicio.
 * Se pausa sola fuera del viewport o con la pestaña oculta.
 */

const STEP_MS = 3000;

const KIND_ICON: Record<EventKind, string> = {
  crm: 'M12 4.4 19.6 8.6 12 12.8 4.4 8.6 12 4.4ZM4.4 12.6l7.6 4.2 7.6-4.2M4.4 16.4l7.6 4.2 7.6-4.2',
  data: 'M12 4.6l1.75 5.65L19.4 12l-5.65 1.75L12 19.4l-1.75-5.65L4.6 12l5.65-1.75L12 4.6Z',
  agenda:
    'M5 7.2h14a1.4 1.4 0 0 1 1.4 1.4v9.6a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6V8.6A1.4 1.4 0 0 1 5 7.2ZM3.6 11h16.8M8.3 4.4v3M15.7 4.4v3',
  follow: 'M18.6 8.8A7 7 0 0 0 6.2 7.6L4.8 9.6M4.6 5.6v4h4M5.4 15.2a7 7 0 0 0 12.4 1.2l1.4-2M19.4 18.4v-4h-4',
  team: 'M9.6 11.4a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2ZM4.2 19.4c.7-3.1 2.8-4.7 5.4-4.7s4.7 1.6 5.4 4.7M17.2 8.2h4.2M19.3 6.1v4.2',
  dash: 'M6 19v-6M12 19V7.6M18 19v-8.4M4.2 19.6h15.6',
};

function EventIcon({ kind }: { kind: EventKind }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={KIND_ICON[kind]} />
    </svg>
  );
}

function CtrlIcon({ kind }: { kind: 'restart' | 'prev' | 'play' | 'pause' | 'next' }) {
  const paths: Record<string, React.ReactNode> = {
    restart: <path d="M4.6 5.6v4h4M4.9 9.4A7.2 7.2 0 1 1 4.8 14" />,
    prev: <path d="M17 5.5 9.5 12l7.5 6.5M7 5.5v13" />,
    next: <path d="M7 5.5 14.5 12 7 18.5M17 5.5v13" />,
    play: <path d="M8 5.4v13.2L19 12 8 5.4Z" />,
    pause: <path d="M8.2 5.4v13.2M15.8 5.4v13.2" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[kind]}
    </svg>
  );
}

export function SystemDemo({ script, id }: { script: DemoScript; id?: string }) {
  const total = script.steps.length;
  const [shown, setShown] = useState(prefersReducedMotion() ? total : 0);
  const [playing, setPlaying] = useState(!prefersReducedMotion());
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  /* Solo corre cuando la demo es visible. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Autoavance; el primer paso entra casi de inmediato al ser visible. */
  useEffect(() => {
    if (!playing || !inView || shown >= total) return;
    const t = window.setTimeout(
      () => {
        if (document.hidden) return;
        setShown((s) => Math.min(s + 1, total));
      },
      shown === 0 ? 450 : STEP_MS,
    );
    return () => window.clearTimeout(t);
  }, [playing, inView, shown, total]);

  /* Al final se detiene; reinicio manual. */
  useEffect(() => {
    if (shown >= total) setPlaying(false);
  }, [shown, total]);

  /* La conversación siempre muestra el último mensaje. */
  useEffect(() => {
    const chat = chatRef.current;
    if (!chat) return;
    chat.scrollTo({ top: chat.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [shown]);

  const steps = script.steps.slice(0, shown);
  const events = useMemo(
    () => steps.flatMap((s, si) => (s.events ?? []).map((ev) => ({ ...ev, step: si }))),
    [steps],
  );
  const lastNote = [...steps].reverse().find((s) => s.note)?.note;
  const atEnd = shown >= total;

  return (
    <div className="dm" ref={rootRef} id={id}>
      {/* ── Teléfono / conversación ── */}
      <div className="dm-phone" data-fx="rise">
        <div className="dm-phead">
          <span className="dm-avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <circle cx="12" cy="9" r="3.4" />
              <path d="M5.4 19.2c.9-3.4 3.4-5.1 6.6-5.1s5.7 1.7 6.6 5.1" />
            </svg>
          </span>
          <div>
            <p className="dm-pname">{script.header}</p>
            <p className="dm-psub">{script.headerSub}</p>
          </div>
          <span className="dm-live" aria-hidden="true" />
        </div>

        <div className="dm-chat" ref={chatRef} aria-live="polite">
          {steps.map((s, i) =>
            s.bubble ? (
              <div key={i} className={`dm-bubble dm-${s.bubble.side}`}>
                {s.bubble.lines.map((l, j) => (
                  <p key={j}>{l}</p>
                ))}
                <span className="dm-time">{s.bubble.time}</span>
              </div>
            ) : null,
          )}
          {shown === 0 && <p className="dm-empty">La conversación inicia en un momento…</p>}
        </div>

        {lastNote && <p className="dm-flash">{lastNote}</p>}
      </div>

      {/* ── Sistema detrás ── */}
      <div className="dm-sys" data-fx="rise" data-fx-delay="0.12">
        <p className="dm-sys-title microlabel">El sistema, detrás</p>
        <div className="dm-events">
          <span className="dm-rail" aria-hidden="true" />
          {events.length === 0 && (
            <p className="dm-empty">Cada acción del agente quedará registrada aquí.</p>
          )}
          {events.map((ev, i) => (
            <div
              key={i}
              className={`dm-event dm-k-${ev.kind}${i === events.length - 1 ? ' is-latest' : ''}`}
            >
              <span className="dm-ev-icon">
                <EventIcon kind={ev.kind} />
              </span>
              <div>
                <p className="dm-ev-sys">{ev.system}</p>
                <p className="dm-ev-detail">{ev.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Controles ── */}
        <div className="dm-controls" role="group" aria-label="Controles de la demostración">
          <button onClick={() => { setShown(0); setPlaying(true); }} aria-label="Reiniciar">
            <CtrlIcon kind="restart" />
          </button>
          <button onClick={() => setShown((s) => Math.max(s - 1, 0))} aria-label="Retroceder" disabled={shown === 0}>
            <CtrlIcon kind="prev" />
          </button>
          <button
            className="dm-play"
            onClick={() => {
              if (atEnd) {
                setShown(0);
                setPlaying(true);
              } else {
                setPlaying((p) => !p);
              }
            }}
            aria-label={playing ? 'Pausar' : 'Reproducir'}
          >
            <CtrlIcon kind={playing ? 'pause' : 'play'} />
          </button>
          <button onClick={() => setShown((s) => Math.min(s + 1, total))} aria-label="Avanzar" disabled={atEnd}>
            <CtrlIcon kind="next" />
          </button>
          <span className="dm-count">
            {shown}/{total}
          </span>
        </div>
        <p className="dm-note">Demostración simulada del flujo real de trabajo.</p>
      </div>
    </div>
  );
}
