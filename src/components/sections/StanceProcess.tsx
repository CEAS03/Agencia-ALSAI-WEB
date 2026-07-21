import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../lib/useReveal';

gsap.registerPlugin(ScrollTrigger);

/**
 * SECCIÓN 4 — Postura + proceso.
 *
 * La secuencia de 4 etapas se construye progresivamente por TIEMPO (no atada
 * al scroll): arranca cuando la sección entra en pantalla y las etapas quedan
 * visibles. Cada etapa enciende su nodo, avanza la línea y revela título y
 * cuerpo con un desfase corto.
 */

/** Manifiesto: `**palabra**` se resalta en cyan. */
const MANIFESTO: string[] = [
  'Las clínicas no tienen un problema de pacientes.',
  'Tienen un **problema de procesos**.',
  'Puedes gastar $4,000 en anuncios y seguir perdiendo',
  'a la mitad porque nadie contestó a tiempo.',
  'No te traemos más ruido.',
  '**Ordenamos, mejoramos y automatizamos tus procesos.**',
];

interface Stage {
  num: string;
  title: string;
  body: string;
}

const STAGES: Stage[] = [
  {
    num: '01',
    title: 'Diagnóstico',
    body: 'Analizamos aquí mismo en qué puntos tu clínica podría estar perdiendo pacientes, tiempo y oportunidades de crecimiento.',
  },
  {
    num: '02',
    title: 'Propuesta estratégica',
    body: 'Diseñamos una solución a la medida de tu operación, conectando las herramientas y procesos que pueden generar el mayor impacto.',
  },
  {
    num: '03',
    title: 'Implementación',
    body: 'Configuramos, conectamos y probamos cada parte del sistema mientras tu equipo continúa atendiendo a sus pacientes.',
  },
  {
    num: '04',
    title: 'Más oportunidades llegan a tu agenda',
    body: 'Cada nuevo contacto recibe respuesta, seguimiento y una ruta clara para avanzar hacia su cita.',
  },
];

/** Un ícono propio por etapa (lupa · nodos conectados · controles · agenda). */
function StageIcon({ i }: { i: number }) {
  const base = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (i) {
    case 0:
      return (
        <svg {...base}>
          <circle cx="10.5" cy="10.5" r="6.1" />
          <path d="M15 15l4.6 4.6" />
        </svg>
      );
    case 1:
      return (
        <svg {...base}>
          <circle cx="6.2" cy="7" r="2.1" />
          <circle cx="17.8" cy="7" r="2.1" />
          <circle cx="12" cy="17.4" r="2.1" />
          <path d="M8.3 7h7.4M7.4 8.9l3.5 6.6M16.6 8.9l-3.5 6.6" />
        </svg>
      );
    case 2:
      return (
        <svg {...base}>
          <path d="M4 8.4h7.6M16.4 8.4H20M4 15.6h3.6M12.4 15.6H20" />
          <circle cx="14" cy="8.4" r="2.3" />
          <circle cx="10" cy="15.6" r="2.3" />
        </svg>
      );
    default:
      return (
        <svg {...base}>
          <rect x="3.5" y="5.6" width="17" height="14.9" rx="2.5" />
          <path d="M3.5 10.2h17M8 3.4v3.3M16 3.4v3.3" />
          <path d="M12 17.6v-4.2M10 15.3l2-2.1 2 2.1" />
        </svg>
      );
  }
}

function renderManifestoLine(line: string, key: number) {
  const parts = line
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((seg, i) => {
      const m = seg.match(/^\*\*([^*]+)\*\*$/);
      return m ? (
        <span className="st-hl" key={i}>
          {m[1]}
        </span>
      ) : (
        <span key={i}>{seg}</span>
      );
    });
  return (
    <span className="st-mline reveal" key={key}>
      {parts}
    </span>
  );
}

export function StanceProcess() {
  const procRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const proc = procRef.current;
    if (!proc) return;

    const steps = Array.from(proc.querySelectorAll<HTMLElement>('.pr-step'));
    const progress = proc.querySelector<HTMLElement>('.pr-progress');
    const list = proc.querySelector<HTMLElement>('.pr-list');
    const head = proc.querySelector<HTMLElement>('.pr-heading');
    const outro = proc.querySelector<HTMLElement>('.pr-outro');
    const glow = proc.querySelector<HTMLElement>('.pr-glow');
    if (!progress || !list || !head || !outro || !glow) return;

    const heads = steps.map((s) => s.querySelector('.pr-head'));
    const bodies = steps.map((s) => s.querySelector('.pr-body'));

    /* Estado final inmediato si se pidió menos movimiento. */
    if (prefersReducedMotion()) {
      steps.forEach((s) => s.classList.add('is-on'));
      gsap.set([head, outro, ...heads, ...bodies], { autoAlpha: 1, y: 0 });
      gsap.set(glow, { autoAlpha: 1 });
      gsap.set(progress, { height: '100%' });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set([head, outro, ...heads, ...bodies], { autoAlpha: 0, y: 12 });
      gsap.set(glow, { autoAlpha: 0 });
      gsap.set(progress, { height: 0 });

      /** Centro vertical de cada nodo, relativo al riel. */
      const yOf = (i: number) => {
        const node = steps[i].querySelector<HTMLElement>('.pr-node');
        if (!node) return 0;
        const lr = list.getBoundingClientRect();
        const nr = node.getBoundingClientRect();
        return nr.top - lr.top + nr.height / 2 - 8;
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: proc,
          start: 'top 72%',
          once: true,
          invalidateOnRefresh: true,
        },
      });

      tl.to(head, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0);

      let t = 0.6;
      steps.forEach((step, i) => {
        const pulse = step.querySelector('.pr-node-pulse');
        const icon = step.querySelector('.pr-icon');

        // La línea avanza hasta el nodo…
        tl.to(progress, { height: yOf(i), duration: 0.6, ease: 'power2.inOut' }, t);

        // …y al llegar, el nodo se enciende con un pulso turquesa.
        tl.add(() => {
          steps.forEach((s, j) => {
            s.classList.toggle('is-on', j === i);
            s.classList.toggle('is-past', j < i);
          });
        }, t + 0.5);

        tl.fromTo(
          pulse,
          { scale: 0.5, autoAlpha: 0.85 },
          { scale: 2.6, autoAlpha: 0, duration: 1, ease: 'power2.out' },
          t + 0.5,
        );

        // Título primero, cuerpo 150 ms después.
        tl.to(heads[i], { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, t + 0.55);
        tl.to(bodies[i], { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, t + 0.7);

        // Micro-giro del ícono al activarse.
        tl.fromTo(
          icon,
          { rotate: -5 },
          { rotate: 0, duration: 0.7, ease: 'back.out(3)', transformOrigin: 'center' },
          t + 0.55,
        );

        t += 2;
      });

      // Cierre: texto de beneficio + brillo sutil detrás de toda la estructura.
      tl.to(outro, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, t);
      tl.to(glow, { autoAlpha: 1, duration: 1.2, ease: 'power1.out' }, t - 0.2);
    }, proc);

    return () => ctx.revert();
  }, []);

  return (
    <section className="sec st shell" aria-labelledby="st-title">
      <h2 id="st-title" className="st-manifesto">
        {MANIFESTO.map((line, i) => renderManifestoLine(line, i))}
      </h2>

      <div className="st-process" ref={procRef}>
        <span className="pr-glow" aria-hidden="true" />

        <h3 className="pr-heading">
          Del diagnóstico a un sistema que trabaja para tu clínica.
        </h3>

        <ol className="pr-list">
          <span className="pr-track" aria-hidden="true" />
          <span className="pr-progress" aria-hidden="true" />

          {STAGES.map((s, i) => (
            <li className={`pr-step${i === STAGES.length - 1 ? ' pr-step--last' : ''}`} key={s.num}>
              <span className="pr-node" aria-hidden="true">
                <span className="pr-node-pulse" />
              </span>

              <div className="pr-head">
                <span className="pr-icon" aria-hidden="true">
                  <StageIcon i={i} />
                </span>
                <h4 className="pr-title">
                  <span className="pr-num">{s.num}</span> · {s.title}
                </h4>
              </div>

              <p className="pr-body">{s.body}</p>
            </li>
          ))}
        </ol>

        <p className="pr-outro">
          El resultado no es solo más tecnología. Es una clínica con mayor capacidad para responder,
          dar seguimiento y convertir oportunidades sin aumentar innecesariamente la carga de su
          equipo.
        </p>
      </div>

      <p className="st-human reveal">
        Detrás de esto hay un equipo pequeño en Querétaro que construye lo que vende. Carlos te
        contesta directo.
      </p>
    </section>
  );
}
