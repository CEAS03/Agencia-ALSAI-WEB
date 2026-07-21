import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../../lib/motion';
import { prefersReducedMotion } from '../../lib/useReveal';
import { Eyebrow, MaskHeading } from '../../components/ui/primitives';

/**
 * SECCIÓN 3 — Sistema ALSAI.
 * Momento firma: un pulso de luz recorre el sistema encendiendo cada
 * módulo al pasar, sincronizado con el scroll (scrub, sin secuestrarlo).
 */

const STEPS = [
  {
    name: 'Atracción',
    body: 'Campañas, contenido y presencia digital generan demanda con intención real, no clics vacíos.',
  },
  {
    name: 'Conversación',
    body: 'Cada persona recibe respuesta inmediata por WhatsApp o web, a cualquier hora, con contexto.',
  },
  {
    name: 'Calificación',
    body: 'El agente entiende qué necesita cada contacto y distingue una oportunidad de una consulta casual.',
  },
  {
    name: 'CRM',
    body: 'Todo queda registrado: quién es, de dónde llegó, qué pidió y en qué etapa está.',
  },
  {
    name: 'Agenda',
    body: 'Los espacios se proponen y reservan sin fricción, conectados a la disponibilidad real.',
  },
  {
    name: 'Seguimiento',
    body: 'Confirmaciones, recordatorios y reactivaciones evitan que las oportunidades se enfríen.',
  },
  {
    name: 'Medición',
    body: 'El tablero muestra qué funciona, qué se fuga y dónde conviene invertir el siguiente peso.',
  },
];

export function Sistema() {
  const flowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const flow = flowRef.current;
    if (!flow) return;

    const items = Array.from(flow.querySelectorAll<HTMLElement>('.sys-item'));
    const fill = flow.querySelector<HTMLElement>('.sys-fill');
    const pulse = flow.querySelector<HTMLElement>('.sys-pulse');
    const rail = flow.querySelector<HTMLElement>('.sys-rail');
    if (!fill || !pulse || !rail) return;

    if (prefersReducedMotion()) {
      items.forEach((it) => it.classList.add('is-on'));
      gsap.set(fill, { scaleY: 1 });
      gsap.set(pulse, { autoAlpha: 0 });
      return;
    }

    let railH = rail.offsetHeight;
    let lastIdx = -1;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: flow,
        start: 'top 62%',
        end: 'bottom 58%',
        scrub: 0.6,
        invalidateOnRefresh: true,
        onRefresh: () => {
          railH = rail.offsetHeight;
        },
        onUpdate: (self) => {
          const p = self.progress;
          gsap.set(fill, { scaleY: p });
          gsap.set(pulse, { y: p * (railH - 14) });
          const idx = Math.min(Math.floor(p * STEPS.length + 0.15), STEPS.length - 1);
          if (idx !== lastIdx) {
            lastIdx = idx;
            items.forEach((it, i) => it.classList.toggle('is-on', i <= idx));
          }
        },
      });
    }, flow);

    return () => ctx.revert();
  }, []);

  return (
    <section className="site-sec" aria-labelledby="sys-title">
      <div className="site-shell">
        <Eyebrow>Sistema ALSAI</Eyebrow>
        <MaskHeading
          id="sys-title"
          className="h-sec"
          text="Un sistema **completo,** no herramientas sueltas."
          style={{ marginTop: 18 }}
        />

        <div className="sys-flow" ref={flowRef}>
          <span className="sys-rail" aria-hidden="true" />
          <span className="sys-fill" aria-hidden="true" />
          <span className="sys-pulse" aria-hidden="true" />

          {STEPS.map((s, i) => (
            <div className="sys-item" key={s.name}>
              <h3 className="sys-name">
                <span className="sys-num">0{i + 1}</span>
                {s.name}
              </h3>
              <p className="sys-body">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="sys-close" data-fx="rise">
          Cada contacto avanza con contexto. Cada acción queda registrada. Cada fuga puede
          detectarse y corregirse.
        </p>
      </div>
    </section>
  );
}
