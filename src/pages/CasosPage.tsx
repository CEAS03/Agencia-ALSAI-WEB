import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, usePageFx } from '../lib/motion';
import { prefersReducedMotion } from '../lib/useReveal';
import { Eyebrow, MaskHeading, IconArrowRight } from '../components/ui/primitives';
import { DiagCta } from '../components/ui/buttons';
import { useTransitionNavigate } from '../components/layout/PageTransition';
import { IconCheck } from '../components/icons';

/**
 * CASOS (/casos) — índice honesto: solo publicamos lo que operamos.
 * Cada tarjeta usa el revelado por capas y navega a su página de detalle.
 */

const CASOS = [
  {
    to: '/casos/blindafon',
    name: 'Blindafon',
    estado: { label: 'Sistema activo', on: true },
    copy: 'Nuestro laboratorio operativo: un negocio real de nanotecnología donde probamos captación, atención por WhatsApp, agenda, CRM y automatización antes de llevarlos a un cliente.',
    cta: 'Ver el caso y hablar con su bot',
  },
  {
    to: '/casos/inmobiliaria',
    name: 'Proyecto inmobiliario',
    estado: { label: 'En implementación', on: false },
    copy: 'Un ecosistema digital conectado para captar, atender y distribuir oportunidades entre asesores, con visibilidad de cada etapa.',
    cta: 'Ver el avance del proyecto',
    pendiente: 'PENDIENTE: autorización de nombre',
  },
];

export default function CasosPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  usePageFx(rootRef);
  const go = useTransitionNavigate();
  const gridRef = useRef<HTMLDivElement>(null);

  /* Revelado por capas de cada tarjeta (marco → contenido). */
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
        ScrollTrigger.create({
          trigger: card,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            window.setTimeout(() => card.classList.add('is-framed'), i * 150);
          },
        });
      });
    }, grid);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef}>
      <section className="cl-hero site-sec" aria-labelledby="cas-title" style={{ minHeight: '62dvh' }}>
        <div className="site-shell">
          <Eyebrow>Casos</Eyebrow>
          <MaskHeading
            as="h1"
            id="cas-title"
            className="h-display"
            text="Sistemas reales, **funcionando hoy.**"
          />
          <p className="t-lead" data-fx="rise">
            No coleccionamos logos: operamos sistemas. Aquí está lo que ya funciona, lo que está en
            implementación y el estado real de cada uno.
          </p>
          <p className="cas-note" data-fx="rise">
            <IconCheck />
            Regla de la casa: sin métricas infladas ni testimonios fabricados. Publicamos
            resultados solo cuando existen y su dueño autoriza compartirlos.
          </p>
        </div>
      </section>

      <section className="site-sec" aria-label="Listado de casos">
        <div className="site-shell">
          <div className="cases-grid" ref={gridRef} style={{ marginTop: 0 }}>
            {CASOS.map((c) => (
              <button className="case-card case-link" key={c.to} onClick={() => go(c.to)}>
                <span className="case-frame" aria-hidden="true" />
                <div className="case-head">
                  <h2 className="case-name">{c.name}</h2>
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
                </div>
                <span className="btn-arrow">
                  {c.cta}
                  <IconArrowRight />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="site-sec cierre" aria-labelledby="casc-title">
        <span className="cierre-glow" aria-hidden="true" />
        <div className="site-shell cierre-inner">
          <Eyebrow>El siguiente caso puede ser el tuyo</Eyebrow>
          <MaskHeading
            id="casc-title"
            className="h-sec"
            text="Empecemos por saber **dónde estás perdiendo clientes.**"
            style={{ marginTop: 18 }}
          />
          <DiagCta />
        </div>
      </section>
    </div>
  );
}
