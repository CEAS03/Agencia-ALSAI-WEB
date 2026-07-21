import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../lib/useReveal';

gsap.registerPlugin(ScrollTrigger);

/**
 * SECCIÓN 2 — Demo de WhatsApp scroll-driven.
 *
 * USE_SCRUB = true  → Enfoque A: el escenario se fija (pin) y la conversación
 *                     avanza atada al scroll (scrub).
 * USE_SCRUB = false → Enfoque B: la timeline corre sola al entrar en viewport,
 *                     sin pin ni scrub (~14 s). Fallback para móvil real.
 *
 * `prefers-reduced-motion` muestra la conversación completa, estática.
 */
const USE_SCRUB = true;

type CardKind = 'ia' | 'crm' | 'agenda' | 'follow';

interface SystemCard {
  kind: CardKind;
  system: string;
  detail: string;
}

type Segment =
  | { type: 'p'; text: string }
  | { type: 'bullets'; items: { label: string; note?: string }[] };

interface Bubble {
  id: string;
  side: 'in' | 'out';
  time: string;
  segments: Segment[];
  flash?: string;
}

const CONVERSATION: Bubble[] = [
  {
    id: 'm1',
    side: 'in',
    time: '9:47 PM',
    segments: [
      { type: 'p', text: 'Hola, me interesa saber más acerca de los brackets y los precios?' },
    ],
  },
  {
    id: 'm2',
    side: 'out',
    time: '9:47 PM',
    flash: 'Respondió en 8 segundos',
    segments: [
      { type: 'p', text: '¡Hola! 😊 Con gusto te explico cómo funciona.' },
      { type: 'p', text: 'El tratamiento va por partes:' },
      {
        type: 'bullets',
        items: [
          { label: 'Valoración inicial — $400', note: 'Revisamos tu caso y vemos qué necesitas.' },
          { label: 'Colocación de brackets — desde $5,000' },
          { label: 'Ajuste mensual — $700' },
        ],
      },
      { type: 'p', text: 'La duración depende de cómo estén tus dientes. Puede ir de 12 a 24 meses.' },
    ],
  },
  {
    id: 'm3',
    side: 'in',
    time: '9:48 PM',
    segments: [{ type: 'p', text: '¿Y las radiografías van aparte?' }],
  },
  {
    id: 'm4',
    side: 'out',
    time: '9:48 PM',
    segments: [
      {
        type: 'p',
        text: 'Depende de tu caso. En la valoración el doctor te dice si las necesitas y cuáles. Así no pagas estudios que no te sirven.',
      },
      { type: 'p', text: 'Para darte números exactos necesitamos verte 20 minutos.' },
      { type: 'p', text: '¿Te late el jueves 4:00 PM o el viernes 11:00 AM?' },
    ],
  },
  {
    id: 'm5',
    side: 'in',
    time: '9:49 PM',
    segments: [{ type: 'p', text: 'Jueves 4pm' }],
  },
  {
    id: 'm6',
    side: 'out',
    time: '9:49 PM',
    segments: [
      { type: 'p', text: '¡Perfecto! Para registrar tu cita, ¿me compartes tu nombre completo?' },
    ],
  },
  {
    id: 'm7',
    side: 'in',
    time: '9:50 PM',
    segments: [{ type: 'p', text: 'Daniel Gutiérrez' }],
  },
  {
    id: 'm8',
    side: 'out',
    time: '9:50 PM',
    segments: [
      { type: 'p', text: 'Listo ✅ Cita registrada a nombre de Daniel Gutiérrez.' },
      { type: 'p', text: 'Jueves 21 a las 4:00 PM.' },
      { type: 'p', text: 'Te mando un recordatorio un día antes.' },
      { type: 'p', text: 'Nos vemos 👋' },
    ],
  },
];

const CARDS: SystemCard[] = [
  { kind: 'ia', system: 'IA', detail: 'Consulta comprendida y atendida en segundos' },
  { kind: 'crm', system: 'CRM', detail: 'Paciente registrado — Ninguna oportunidad se pierde' },
  { kind: 'agenda', system: 'AGENDA', detail: 'Valoración agendada — Jue 21 · 4:00 PM' },
  {
    kind: 'follow',
    system: 'Seguimiento automático',
    detail: 'Confirmación enviada — Seguimiento activado',
  },
];

/* ── Avatar: logo de diente (SVG, sin imágenes externas) ───────────────── */
function ToothAvatar() {
  return (
    <span className="wa-avatar" aria-hidden="true">
      <svg viewBox="0 0 48 48" width="34" height="34">
        <path
          d="M24 9.5c-3.4 0-4.9 1.5-7.5 1.5-3 0-5.6 2.4-5.6 6.8 0 5.2 1.8 8.4 2.9 12.3.8 2.8 1.1 8 3.7 8 2.4 0 2.6-5.2 3.9-8.4.5-1.3 1.1-2.1 2.4-2.1s1.9.8 2.4 2.1c1.3 3.2 1.5 8.4 3.9 8.4 2.6 0 2.9-5.2 3.7-8 1.1-3.9 2.9-7.1 2.9-12.3 0-4.4-2.6-6.8-5.6-6.8-2.6 0-4.1-1.5-7.5-1.5Z"
          fill="#2ea8e6"
        />
        <path
          d="M12.5 22.5c6.5 3.6 18.5 4.2 26-3.4-1.5 4.6-9 8.6-16.5 8.4-5-.1-8.4-2.2-9.5-5Z"
          fill="#1c7fc0"
        />
        <path
          d="M13.2 17.8c1.1-3.1 3.6-4.6 6.2-4.8-2.6 1.2-4.4 2.7-5.3 5.2-.3.8-1.2.4-.9-.4Z"
          fill="#fff"
          opacity=".9"
        />
        <path
          d="m31.5 14.6.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3ZM35.8 19.7l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5.5-1.3Z"
          fill="#fff"
        />
      </svg>
    </span>
  );
}

/* ── Flecha del indicador de scroll (trazo propio, sin emoji) ──────────── */
function ArrowDown() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2.4v9.2" />
      <path d="M4.3 8.3 8 12l3.7-3.7" />
    </svg>
  );
}

/* ── Iconos de tarjeta con partes animables ────────────────────────────── */
function CardIcon({ kind }: { kind: CardKind }) {
  const base = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (kind) {
    case 'ia':
      return (
        <svg {...base}>
          <path className="ico-pulse" d="M3 12h3.6l2-5 3.6 10 1.9-5H21" />
        </svg>
      );
    case 'crm':
      return (
        <svg {...base}>
          <circle cx="10" cy="8.6" r="3.1" />
          <path d="M4.4 18.8c.6-3.1 2.7-4.7 5.6-4.7 1 0 1.9.2 2.7.6" />
          <g className="ico-plus">
            <path d="M17.6 13.2v5.6M14.8 16h5.6" />
          </g>
        </svg>
      );
    case 'agenda':
      return (
        <svg {...base}>
          <rect x="3.4" y="5.4" width="17.2" height="15.2" rx="2.6" />
          <path d="M3.4 10.1h17.2M8 3.2v3.4M16 3.2v3.4" />
          <path className="ico-cal-check" d="M8.6 14.9l2.4 2.4 4.4-4.6" />
        </svg>
      );
    case 'follow':
      return (
        <svg {...base}>
          <circle className="ico-ring" cx="12" cy="12" r="8.6" />
          <path className="ico-check" d="M7.8 12.4l2.9 2.9 5.5-6" />
        </svg>
      );
  }
}

function BubbleView({ bubble }: { bubble: Bubble }) {
  return (
    <div className={`wa-row wa-row--${bubble.side}`}>
      <div className="wa-bubble">
        {bubble.segments.map((seg, i) =>
          seg.type === 'p' ? (
            <p className="wa-line" key={i}>
              {seg.text}
            </p>
          ) : (
            <ul className="wa-bullets" key={i}>
              {seg.items.map((it, j) => (
                <li key={j}>
                  <span className="wa-bullet-label">{it.label}</span>
                  {it.note && <span className="wa-bullet-note">{it.note}</span>}
                </li>
              ))}
            </ul>
          ),
        )}
        <span className="wa-time">{bubble.time}</span>
      </div>
    </div>
  );
}

export function WhatsappDemo() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const q = gsap.utils.selector(root);
    const msg = (id: string) => root.querySelector<HTMLElement>(`[data-msg="${id}"]`);
    const typing = (id: string) => root.querySelector<HTMLElement>(`[data-typing="${id}"]`);
    const card = (kind: CardKind) => root.querySelector<HTMLElement>(`[data-card="${kind}"]`);

    /* Estado final estático si el usuario pidió menos movimiento. */
    if (prefersReducedMotion()) {
      gsap.set(q('.wa-msg'), { height: 'auto', marginTop: 9, autoAlpha: 1 });
      gsap.set(q('.wa-bubble, .wa-flash, .wa-card'), { autoAlpha: 1, y: 0, scale: 1, filter: 'none' });
      gsap.set(q('.wa-typing-row'), { display: 'none' });
      return;
    }

    const ctx = gsap.context(() => {
      /* ── Estados iniciales ── */
      gsap.set(q('.wa-msg, .wa-typing-row'), { height: 0, marginTop: 0, autoAlpha: 1 });
      gsap.set(q('.wa-bubble'), { autoAlpha: 0, y: 12, scale: 0.96 });
      gsap.set(q('.wa-typing'), { autoAlpha: 0 });
      gsap.set(q('.wa-flash'), { autoAlpha: 0, scale: 0.8 });
      gsap.set(q('.wa-card'), { autoAlpha: 0, y: 18, filter: 'blur(6px)' });
      gsap.set(q('.wa-card-beam'), { scaleY: 0, autoAlpha: 0 });
      gsap.set(q('.wa-card-halo'), { autoAlpha: 0 });
      gsap.set(q('.ico-plus'), { autoAlpha: 0, scale: 0, transformOrigin: 'center' });

      /* Trazos que se "dibujan" */
      const drawables = Array.from(
        root.querySelectorAll<SVGGeometryElement>(
          '.ico-pulse, .ico-cal-check, .ico-check, .ico-ring',
        ),
      );
      drawables.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });

      /* ── Helpers de timeline ── */
      const showTyping = (tl: gsap.core.Timeline, id: string) => {
        const row = typing(id);
        if (!row) return;
        tl.to(row, { height: 'auto', marginTop: 9, duration: 0.28, ease: 'power2.out' })
          .to(row.querySelector('.wa-typing'), { autoAlpha: 1, duration: 0.18 }, '<')
          .to({}, { duration: 0.7 })
          .to(row.querySelector('.wa-typing'), { autoAlpha: 0, duration: 0.12 })
          .to(row, { height: 0, marginTop: 0, duration: 0.18, ease: 'power2.in' }, '<');
      };

      const showMsg = (tl: gsap.core.Timeline, id: string) => {
        const wrap = msg(id);
        if (!wrap) return;
        tl.to(wrap, { height: 'auto', marginTop: 9, duration: 0.32, ease: 'power2.out' }).fromTo(
          wrap.querySelector('.wa-bubble'),
          { autoAlpha: 0, y: 12, scale: 0.96 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' },
          '<0.06',
        );
      };

      /** Microanimación propia de cada tarjeta. */
      const iconAnim = (tl: gsap.core.Timeline, kind: CardKind, el: HTMLElement) => {
        const find = <T extends Element>(sel: string) => el.querySelector<T>(sel);
        switch (kind) {
          case 'ia': {
            const p = find<SVGPathElement>('.ico-pulse');
            if (p) {
              const len = p.getTotalLength();
              tl.fromTo(
                p,
                { strokeDashoffset: len },
                { strokeDashoffset: 0, duration: 0.5, ease: 'none', repeat: 1 },
                '<',
              );
            }
            break;
          }
          case 'crm':
            tl.to(find('.ico-plus'), { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, '<0.1');
            break;
          case 'agenda': {
            const c = find<SVGPathElement>('.ico-cal-check');
            if (c) tl.to(c, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' }, '<0.1');
            break;
          }
          case 'follow': {
            const ring = find<SVGCircleElement>('.ico-ring');
            const chk = find<SVGPathElement>('.ico-check');
            if (ring) tl.to(ring, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' }, '<');
            if (chk) tl.to(chk, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out' }, '<0.2');
            break;
          }
        }
      };

      const showCard = (tl: gsap.core.Timeline, kind: CardKind) => {
        const el = card(kind);
        if (!el) return;
        const beam = el.querySelector('.wa-card-beam');
        const halo = el.querySelector('.wa-card-halo');

        // Pulso de luz que baja desde el teléfono y activa la tarjeta
        tl.to(beam, { autoAlpha: 1, scaleY: 1, duration: 0.28, ease: 'power2.in' })
          .to(beam, { autoAlpha: 0, duration: 0.2 }, '>-0.05')
          .to(
            el,
            { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.42, ease: 'power2.out' },
            '<0.05',
          )
          // Borde turquesa que se ilumina ~1s y se apaga
          .to(halo, { autoAlpha: 1, duration: 0.25 }, '<')
          .to(halo, { autoAlpha: 0, duration: 0.6 }, '>0.35');

        iconAnim(tl, kind, el);
      };

      /* ── Timeline principal ── */
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: stage,
          start: USE_SCRUB ? 'center center' : 'top 78%',
          end: USE_SCRUB ? '+=260%' : undefined,
          pin: USE_SCRUB ? stage : false,
          scrub: USE_SCRUB ? 1 : false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          once: !USE_SCRUB,
        },
      });

      // 1) El paciente escribe
      showMsg(tl, 'm1');
      tl.to({}, { duration: 0.5 });

      // 2) Tres puntos de escritura → la IA responde
      showTyping(tl, 'm2');
      showMsg(tl, 'm2');
      tl.to(q('.wa-flash'), { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(1.8)' }, '<0.1');

      // 3) Se ilumina IA, y un pulso baja hasta CRM
      showCard(tl, 'ia');
      showCard(tl, 'crm');

      // 4) Sigue la conversación
      tl.to({}, { duration: 0.45 });
      showMsg(tl, 'm3');
      showTyping(tl, 'm4');
      showMsg(tl, 'm4');

      // 5) El paciente acepta una hora
      tl.to({}, { duration: 0.45 });
      showMsg(tl, 'm5');

      // 6) El bot pide el nombre y el paciente lo escribe → Agenda
      showTyping(tl, 'm6');
      showMsg(tl, 'm6');
      tl.to({}, { duration: 0.45 });
      showMsg(tl, 'm7');
      showCard(tl, 'agenda');

      // 7) Confirmación a nombre del paciente → palomita → Seguimiento
      showTyping(tl, 'm8');
      showMsg(tl, 'm8');
      showCard(tl, 'follow');
      tl.to({}, { duration: 0.9 });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="sec wa shell" aria-labelledby="wa-title">
      {/* Título de contexto */}
      <h2 id="wa-title" className="wa-lead reveal">
        Así se convierte una consulta fuera de horario en una oportunidad atendida, registrada y con
        pacientes nuevos
      </h2>

      {/* 2.1 — Reloj de pared */}
      <div className="wa-clock reveal">
        <p className="microlabel wa-day">Sábado</p>
        <p className="wa-time-big">
          9:00 <span className="wa-ampm">PM</span>
          <span className="wa-moon" aria-hidden="true" />
        </p>
        <p className="wa-context">
          Tu clínica está cerrada.
          <br />
          Tu sistema no.
        </p>
      </div>

      {/* 2.2–2.4 — Escenario fijado: teléfono + tarjetas */}
      <div className="wa-stage" ref={stageRef}>
        {/* Permanece visible mientras el escenario está fijado */}
        <p className="wa-scrollhint">
          Desliza hacia abajo
          <ArrowDown />
        </p>

        <div className="wa-stage-row">
          <div className="wa-phone">
          <span className="wa-notch" aria-hidden="true" />
          <header className="wa-bar">
            <ToothAvatar />
            <span className="wa-peer">
              <span className="wa-peer-name">Clínica Dental</span>
              <span className="wa-peer-status">en línea</span>
            </span>
          </header>

          <div className="wa-chat">
            <div className="wa-thread">
              {CONVERSATION.map((bubble) => (
                <div key={bubble.id}>
                  {bubble.side === 'out' && (
                    <div className="wa-typing-row" data-typing={bubble.id}>
                      <div className="wa-row wa-row--out">
                        <div className="wa-typing">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="wa-msg" data-msg={bubble.id}>
                    {bubble.flash && (
                      <p className="wa-flash">
                        <span className="wa-flash-bolt" aria-hidden="true">
                          ⚡
                        </span>
                        {bubble.flash}
                      </p>
                    )}
                    <BubbleView bubble={bubble} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="wa-cards">
          {CARDS.map((c) => (
            <div className={`wa-card wa-card--${c.kind}`} data-card={c.kind} key={c.kind}>
              <span className="wa-card-beam" aria-hidden="true" />
              <span className="wa-card-halo" aria-hidden="true" />
              <span className="wa-card-icon" aria-hidden="true">
                <CardIcon kind={c.kind} />
              </span>
              <span className="wa-card-text">
                <span className="wa-card-system microlabel">{c.system}</span>
                <span className="wa-card-detail">{c.detail}</span>
              </span>
            </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2.5 — Cierre */}
      <p className="wa-close reveal">
        Mientras tu equipo descansa, tu clínica sigue atendiendo, agendando y creciendo.
      </p>
    </section>
  );
}
