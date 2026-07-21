import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../../lib/motion';
import { prefersReducedMotion } from '../../lib/useReveal';
import { Eyebrow, MaskHeading } from '../../components/ui/primitives';

/**
 * SECCIÓN 8 — Casos.
 * Revelado por capas: primero el marco se dibuja, luego la mini-UI, al
 * final el estado. Sin métricas inventadas; estados claramente marcados.
 */

interface Caso {
  name: string;
  copy: string;
  estado: { label: string; on: boolean };
  pendiente?: string;
}

const CASOS: Caso[] = [
  {
    name: 'Blindafon',
    copy: 'Nuestro laboratorio operativo: probamos captación, seguimiento, CRM y automatización en un negocio real antes de llevarlo a un cliente.',
    estado: { label: 'Sistema activo', on: true },
  },
  {
    name: 'Proyecto inmobiliario',
    copy: 'Un ecosistema digital conectado para captar, atender y distribuir oportunidades.',
    estado: { label: 'En implementación', on: false },
    pendiente: 'PENDIENTE: autorización de nombre',
  },
];

export function Casos() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.case-card'));

    if (prefersReducedMotion()) {
      cards.forEach((c) => c.classList.add('is-framed'));
      return;
    }

    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        const ui = card.querySelector('.case-ui');
        const bars = card.querySelectorAll('.case-ui span');
        const foot = card.querySelector('.case-foot');
        const head = card.querySelector('.case-head');
        const copy = card.querySelector('.case-copy');

        gsap.set([head, copy, ui, foot], { autoAlpha: 0, y: 18 });

        ScrollTrigger.create({
          trigger: card,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            const tl = gsap.timeline({ delay: i * 0.16 });
            tl.add(() => card.classList.add('is-framed'))
              .to(head, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }, 0.35)
              .to(copy, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }, 0.48)
              .to(ui, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.62)
              .fromTo(
                bars,
                { scaleX: 0 },
                { scaleX: 1, duration: 0.7, ease: 'power3.inOut', stagger: 0.09 },
                0.75,
              )
              .to(foot, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 1.05);
          },
        });
      });
    }, grid);

    return () => ctx.revert();
  }, []);

  return (
    <section className="site-sec" aria-labelledby="cases-title">
      <div className="site-shell">
        <Eyebrow>Casos</Eyebrow>
        <MaskHeading
          id="cases-title"
          className="h-sec"
          text="Sistemas reales, **funcionando hoy.**"
          style={{ marginTop: 18 }}
        />

        <div className="cases-grid" ref={gridRef}>
          {CASOS.map((c) => (
            <article className="case-card" key={c.name}>
              <span className="case-frame" aria-hidden="true" />
              <div className="case-head">
                <h3 className="case-name">{c.name}</h3>
                <span className={`chip${c.estado.on ? ' chip--on' : ''}`}>{c.estado.label}</span>
              </div>
              <p className="case-copy">{c.copy}</p>
              <div className="case-ui" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="case-foot">
                {c.pendiente && <span className="pend">[{c.pendiente}]</span>}
                {!c.pendiente && (
                  <span className="t-body" style={{ fontSize: 13 }}>
                    Operando con supervisión del equipo ALSAI.
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
