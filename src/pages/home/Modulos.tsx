import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/motion';
import { prefersReducedMotion } from '../../lib/useReveal';
import { Eyebrow, MaskHeading } from '../../components/ui/primitives';

/**
 * SECCIÓN 5 — Soluciones modulares.
 * Seis piezas, un solo sistema. Al pasar el cursor por una tarjeta se
 * dibujan líneas hacia los módulos que alimenta (solo escritorio).
 */

interface Mod {
  title: string;
  body: string;
  icon: string;
  /** Índices de los módulos que esta pieza alimenta. */
  links: number[];
}

const MODS: Mod[] = [
  {
    title: 'Captación y demanda',
    body: 'Campañas de Meta y Google, contenido, SEO, landings y funnels. Atraemos oportunidades con intención, no clics vacíos.',
    icon: 'M4.6 13.6v-3.2L16 6v12L4.6 13.6ZM7.8 14.4v2.6c0 .85.6 1.55 1.45 1.7l1.55.25M18.6 9.4a4.3 4.3 0 0 1 0 5.2',
    links: [1, 2],
  },
  {
    title: 'Atención inteligente',
    body: 'Agentes de IA en web y WhatsApp: responden al instante, califican, recopilan datos y pasan el contexto a tu equipo.',
    icon: 'M12 4.6l1.75 5.65L19.4 12l-5.65 1.75L12 19.4l-1.75-5.65L4.6 12l5.65-1.75L12 4.6Z',
    links: [2, 3],
  },
  {
    title: 'CRM y proceso comercial',
    body: 'Todos tus contactos, pipeline, historial, tareas y alertas en un solo lugar, con visibilidad de cada oportunidad.',
    icon: 'M12 4.4 19.6 8.6 12 12.8 4.4 8.6 12 4.4ZM4.4 12.6l7.6 4.2 7.6-4.2M4.4 16.4l7.6 4.2 7.6-4.2',
    links: [3, 5],
  },
  {
    title: 'Agenda, seguimiento y recuperación',
    body: 'Agendado, confirmaciones, recordatorios, recuperación de presupuestos, reactivación y reseñas.',
    icon: 'M5 7.2h14a1.4 1.4 0 0 1 1.4 1.4v9.6a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6V8.6A1.4 1.4 0 0 1 5 7.2ZM3.6 11h16.8M8.3 4.4v3M15.7 4.4v3',
    links: [2, 5],
  },
  {
    title: 'Experiencias web que convierten',
    body: 'Sitios premium, landings, formularios inteligentes y demos interactivas conectadas a todo el sistema.',
    icon: 'M4 6.4h16a1 1 0 0 1 1 1v9.2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7.4a1 1 0 0 1 1-1ZM3 9.6h18M6 8h.01M8.4 8h.01',
    links: [0, 1],
  },
  {
    title: 'Automatización, datos y optimización',
    body: 'Integraciones, tareas administrativas automatizadas, dashboards y mejora continua con datos reales.',
    icon: 'M13.2 3.8 5.6 13.6h5.2l-1 6.6 7.6-9.8h-5.2l1-6.6Z',
    links: [2, 4],
  },
];

export function Modulos() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    if (!wrap || !svg) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const cards = Array.from(wrap.querySelectorAll<HTMLElement>('.mod-card'));
    let active: gsap.core.Tween[] = [];

    const center = (el: HTMLElement) => {
      const w = wrap.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left - w.left + r.width / 2, y: r.top - w.top + r.height / 2 };
    };

    const clear = () => {
      active.forEach((t) => t.kill());
      active = [];
      svg.querySelectorAll('path').forEach((p) => p.remove());
      cards.forEach((c) => c.classList.remove('is-linked'));
    };

    const draw = (i: number) => {
      clear();
      const from = center(cards[i]);
      MODS[i].links.forEach((t, k) => {
        const to = center(cards[t]);
        cards[t].classList.add('is-linked');
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 46;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`);
        svg.appendChild(path);
        const len = path.getTotalLength();
        path.style.strokeDasharray = `${len}`;
        path.style.strokeDashoffset = `${len}`;
        active.push(
          gsap.to(path, {
            strokeDashoffset: 0,
            opacity: 0.7,
            duration: 0.55,
            delay: k * 0.08,
            ease: 'power2.out',
          }),
        );
      });
    };

    const enters = cards.map((card, i) => {
      const onEnter = () => draw(i);
      card.addEventListener('pointerenter', onEnter);
      return onEnter;
    });
    const onLeave = () => clear();
    wrap.addEventListener('pointerleave', onLeave);

    return () => {
      cards.forEach((card, i) => card.removeEventListener('pointerenter', enters[i]));
      wrap.removeEventListener('pointerleave', onLeave);
      clear();
    };
  }, []);

  return (
    <section className="site-sec" aria-labelledby="mods-title">
      <div className="site-shell">
        <Eyebrow>Soluciones modulares</Eyebrow>
        <MaskHeading
          id="mods-title"
          className="h-sec"
          text="**Seis piezas.** Un solo sistema."
          style={{ marginTop: 18 }}
        />
        <p className="t-lead" data-fx="rise" style={{ marginTop: 20 }}>
          Se contratan y configuran según tu diagnóstico, pero siempre trabajan conectadas.
        </p>

        <div className="mods-wrap" ref={wrapRef}>
          <svg className="mods-net" ref={svgRef} aria-hidden="true">
            <defs>
              <linearGradient id="mods-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4d9dff" />
                <stop offset="100%" stopColor="#37e2e4" />
              </linearGradient>
            </defs>
          </svg>

          <div className="mods-grid" data-fx-group>
            {MODS.map((m, i) => (
              <article className="g-card mod-card" key={m.title} data-cursor="hot">
                <p className="mod-num">0{i + 1}</p>
                <h3 className="mod-title">{m.title}</h3>
                <p className="mod-body">{m.body}</p>
                <span className="mod-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d={m.icon} />
                  </svg>
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
