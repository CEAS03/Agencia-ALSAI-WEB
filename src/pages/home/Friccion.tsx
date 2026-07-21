import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../../lib/motion';
import { prefersReducedMotion } from '../../lib/useReveal';
import { Eyebrow, MaskHeading } from '../../components/ui/primitives';

/**
 * SECCIÓN 2 — La fricción invisible.
 * Momento firma: las "islas" (Mensajes, Agenda, CRM, Anuncios) flotan
 * desconectadas y un contacto cae por el hueco entre ellas, en bucle.
 */

interface Isla {
  label: string;
  path: string;
  x: number; // % del ancho del escenario
  y: number; // % de la altura
}

const ISLAS: Isla[] = [
  {
    label: 'Mensajes',
    path: 'M12 4.5a7.5 7.5 0 0 0-6.42 11.38L4.6 19.4l3.62-.94A7.5 7.5 0 1 0 12 4.5Z',
    x: 6,
    y: 12,
  },
  {
    label: 'Agenda',
    path: 'M5 7.2h14a1.4 1.4 0 0 1 1.4 1.4v9.6a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6V8.6A1.4 1.4 0 0 1 5 7.2ZM3.6 11h16.8M8.3 4.4v3M15.7 4.4v3',
    x: 64,
    y: 8,
  },
  {
    label: 'CRM',
    path: 'M12 4.4 19.6 8.6 12 12.8 4.4 8.6 12 4.4ZM4.4 12.6l7.6 4.2 7.6-4.2M4.4 16.4l7.6 4.2 7.6-4.2',
    x: 66,
    y: 66,
  },
  {
    label: 'Anuncios',
    path: 'M4.6 13.6v-3.2L16 6v12L4.6 13.6ZM7.8 14.4v2.6c0 .85.6 1.55 1.45 1.7l1.55.25M18.6 9.4a4.3 4.3 0 0 1 0 5.2',
    x: 8,
    y: 68,
  },
];

/* Enlaces punteados: pares de índices de islas (rotos, parpadean). */
const LINKS: [number, number][] = [
  [0, 1],
  [1, 2],
  [3, 0],
];

export function Friccion() {
  const stageRef = useRef<HTMLDivElement>(null);
  const travelerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const traveler = travelerRef.current;
    if (!stage || !traveler) return;
    if (prefersReducedMotion()) {
      gsap.set(stage.querySelectorAll('.fric-isla'), { autoAlpha: 1 });
      return;
    }

    const islas = Array.from(stage.querySelectorAll<HTMLElement>('.fric-isla'));
    const lines = Array.from(stage.querySelectorAll<SVGLineElement>('.fric-net line'));

    const ctx = gsap.context(() => {
      /* Entrada: islas dispersas aparecen escalonadas. */
      gsap.fromTo(
        islas,
        { autoAlpha: 0, scale: 0.88, y: 26 },
        {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.13,
          scrollTrigger: { trigger: stage, start: 'top 78%', once: true },
        },
      );

      /* Deriva perpetua: cada isla flota a su propio ritmo. */
      islas.forEach((isla, i) => {
        gsap.to(isla, {
          y: `+=${9 + (i % 3) * 4}`,
          duration: 2.8 + i * 0.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 0.9 + i * 0.2,
        });
      });

      /* Conexiones rotas que parpadean. */
      lines.forEach((line, i) => {
        gsap.fromTo(
          line,
          { opacity: 0.12 },
          {
            opacity: 0.45,
            duration: 1.6 + i * 0.35,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            scrollTrigger: { trigger: stage, start: 'top 78%', once: true },
          },
        );
      });

      /* El contacto que se pierde: viaja de Mensajes hacia Agenda y cae
         por el hueco. Bucle con pausa, solo mientras la sección se ve. */
      const runTrip = () => {
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        const from = { x: (ISLAS[0].x / 100) * w + 60, y: (ISLAS[0].y / 100) * h + 24 };
        const mid = { x: 0.46 * w, y: 0.42 * h };
        const fall = { x: 0.5 * w, y: h * 1.02 };

        const trip = gsap.timeline({ repeat: -1, repeatDelay: 2.4 });
        trip
          .set(traveler, { x: from.x, y: from.y, autoAlpha: 0 })
          .to(traveler, { autoAlpha: 1, duration: 0.3 })
          .to(traveler, { x: mid.x, y: mid.y, duration: 1.4, ease: 'sine.inOut' })
          .to(traveler, {
            x: fall.x,
            y: fall.y,
            duration: 0.9,
            ease: 'power2.in',
          })
          .to(traveler, { autoAlpha: 0, duration: 0.25 }, '-=0.35');
        return trip;
      };

      let trip: gsap.core.Timeline | null = null;
      ScrollTrigger.create({
        trigger: stage,
        start: 'top 85%',
        end: 'bottom 5%',
        onEnter: () => {
          trip = trip ?? runTrip();
          trip.play();
        },
        onEnterBack: () => trip?.play(),
        onLeave: () => trip?.pause(),
        onLeaveBack: () => trip?.pause(),
      });
    }, stage);

    return () => ctx.revert();
  }, []);

  return (
    <section className="site-sec" aria-labelledby="fric-title">
      <div className="site-shell">
        <div className="fric-grid">
          <div>
            <Eyebrow>La fricción invisible</Eyebrow>
            <MaskHeading
              id="fric-title"
              className="h-sec"
              text="El crecimiento se frena **entre una herramienta y la siguiente.**"
              style={{ marginTop: 18 }}
            />
            <p className="t-lead" data-fx="rise" style={{ marginTop: 22 }}>
              Una campaña genera interés. Pero si la respuesta tarda, el contacto no entra al CRM,
              nadie confirma la cita o el seguimiento se detiene… la oportunidad se pierde antes de
              convertirse en cliente.
            </p>
          </div>

          <div className="fric-stage" ref={stageRef} aria-hidden="true">
            <svg className="fric-net" viewBox="0 0 100 100" preserveAspectRatio="none">
              {LINKS.map(([a, b], i) => (
                <line
                  key={i}
                  x1={ISLAS[a].x + 9}
                  y1={ISLAS[a].y + 7}
                  x2={ISLAS[b].x + 9}
                  y2={ISLAS[b].y + 7}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {ISLAS.map((isla) => (
              <span
                key={isla.label}
                className="fric-isla"
                style={{ left: `${isla.x}%`, top: `${isla.y}%` }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d={isla.path} />
                </svg>
                {isla.label}
              </span>
            ))}

            <span className="fric-gap" />

            <div ref={travelerRef} className="fric-dot">
              <span className="fric-dot-label">1 contacto nuevo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
