import { useRef } from 'react';
import { usePageFx } from '../lib/motion';
import { site } from '../config/site';
import { Eyebrow, MaskHeading, ArrowLink } from '../components/ui/primitives';
import { DiagCta } from '../components/ui/buttons';
import { useTransitionNavigate } from '../components/layout/PageTransition';
import { IconPin } from '../components/icons';

/**
 * NOSOTROS (/nosotros) — quién está detrás y cómo pensamos.
 * Sin biografías infladas: lo comprobable (Querétaro, Blindafon, este
 * sitio) habla por nosotros. Foto del fundador marcada [PENDIENTE].
 */

const PRINCIPIOS = [
  {
    t: 'Sistemas, no herramientas sueltas',
    b: 'No vendemos "un bot" ni "una página": conectamos captación, atención, registro y seguimiento para que el crecimiento no dependa de la memoria de nadie.',
    icon: 'M12 4.4 19.6 8.6 12 12.8 4.4 8.6 12 4.4ZM4.4 12.6l7.6 4.2 7.6-4.2',
  },
  {
    t: 'Honestidad con los datos',
    b: 'Sin métricas infladas, sin testimonios fabricados, sin precios sorpresa. Donde no hay un dato real publicable, verás un espacio pendiente — nunca un invento.',
    icon: 'M12 4.8l2.2 4.6 5 .7-3.6 3.5.85 5-4.45-2.4-4.45 2.4.85-5L4.8 10.1l5-.7L12 4.8Z',
  },
  {
    t: 'Lo probamos primero en casa',
    b: 'Blindafon, nuestro laboratorio operativo, corre cada sistema antes que cualquier cliente. Y este sitio que estás viendo es nuestro propio portafolio funcionando.',
    icon: 'M13.2 3.8 5.6 13.6h5.2l-1 6.6 7.6-9.8h-5.2l1-6.6Z',
  },
  {
    t: 'El humano decide',
    b: 'La IA atiende lo repetitivo; las decisiones, el criterio y el trato delicado son de tu equipo. Cada flujo define dónde interviene una persona.',
    icon: 'M9.6 11.4a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2ZM4.2 19.4c.7-3.1 2.8-4.7 5.4-4.7s4.7 1.6 5.4 4.7',
  },
];

export default function NosotrosPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  usePageFx(rootRef);
  const go = useTransitionNavigate();

  return (
    <div ref={rootRef}>
      {/* ── Hero: la postura ── */}
      <section className="abt-hero site-sec" aria-labelledby="abt-title">
        <div className="site-shell">
          <Eyebrow>Nosotros</Eyebrow>
          <MaskHeading
            as="h1"
            id="abt-title"
            className="h-display"
            text="La tecnología solo genera valor cuando **mejora la forma** en que un negocio atrae, atiende, decide y opera."
          />
          <p className="t-lead" data-fx="rise">
            ALSAI es un equipo pequeño en Querétaro que construye lo que vende. Sin
            intermediarios, sin plantillas recicladas: quien diseña tu sistema es quien te
            contesta el WhatsApp.
          </p>
        </div>
      </section>

      {/* ── Fundador ── */}
      <section className="site-sec" aria-labelledby="abtf-title">
        <div className="site-shell">
          <Eyebrow>Quién está detrás</Eyebrow>
          <MaskHeading
            id="abtf-title"
            as="h2"
            className="h-sec"
            text="Carlos Álvarez, **fundador.**"
            style={{ marginTop: 18 }}
          />
          <div className="abt-grid" style={{ marginTop: 'clamp(30px, 5vh, 48px)' }}>
            <div className="abt-founder" data-fx="rise">
              <div className="founder-card">
                <div className="founder-photo" aria-hidden={site.founder.photoSrc ? undefined : true}>
                  {site.founder.photoSrc ? (
                    <img src={site.founder.photoSrc} alt={site.founder.name} />
                  ) : (
                    <span className="founder-monogram">CA</span>
                  )}
                </div>
                <div>
                  <p className="founder-name">{site.founder.name}</p>
                  <p className="founder-role">{site.founder.role}</p>
                  <p className="founder-location">
                    <IconPin />
                    {site.founder.location}
                  </p>
                </div>
              </div>
              {!site.founder.photoSrc && (
                <p className="abt-photo-pend">
                  <span className="pend">[PENDIENTE: fotografía de Carlos]</span>
                </p>
              )}
            </div>

            <div className="nos-note" data-fx="rise" data-fx-delay="0.12">
              <p>
                Carlos fundó ALSAI con una convicción simple: la mayoría de los negocios no tiene
                un problema de clientes, tiene un problema de procesos desconectados. Antes de
                ofrecer una sola solución, construyó y operó su propio negocio — Blindafon — para
                probar cada pieza con clientes reales.
              </p>
              <p style={{ marginTop: 14 }}>
                Hoy ese mismo criterio guía cada proyecto: primero entender la operación, después
                conectar el sistema, y medir todo lo demás.
              </p>
              <div style={{ marginTop: 20 }}>
                <ArrowLink onClick={() => go('/casos/blindafon')}>
                  Conoce el laboratorio: Blindafon
                </ArrowLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Principios ── */}
      <section className="site-sec" aria-labelledby="abtp-title">
        <div className="site-shell">
          <Eyebrow>Cómo pensamos</Eyebrow>
          <MaskHeading
            id="abtp-title"
            as="h2"
            className="h-sec"
            text="Cuatro principios que **no negociamos.**"
            style={{ marginTop: 18 }}
          />
          <div className="abt-principles" data-fx-group>
            {PRINCIPIOS.map((p) => (
              <div className="abt-principle" key={p.t}>
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={p.icon} />
                  </svg>
                  {p.t}
                </h3>
                <p>{p.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Este sitio como prueba ── */}
      <section className="site-sec" aria-labelledby="abts-title">
        <div className="site-shell">
          <div className="tcl-card" data-fx="rise">
            <span className="tcl-beam" aria-hidden="true" />
            <Eyebrow>La prueba está frente a ti</Eyebrow>
            <MaskHeading
              id="abts-title"
              className="h-sec"
              text="Este sitio **lo construimos nosotros.**"
              style={{ marginTop: 16 }}
            />
            <p className="t-lead tcl-copy" data-fx="rise">
              El fondo vivo, las animaciones, el diagnóstico con IA y la velocidad con la que
              carga: todo lo que ves aquí es el mismo estándar que aplicamos a los proyectos de
              nuestros clientes. Si tu web se sintiera así, ¿cuántas oportunidades más
              convertiría?
            </p>
            <ArrowLink onClick={() => go('/soluciones')}>Ver lo que podemos construir</ArrowLink>
          </div>
        </div>
      </section>

      {/* ── Cierre ── */}
      <section className="site-sec cierre" aria-labelledby="abtc-title">
        <span className="cierre-glow" aria-hidden="true" />
        <div className="site-shell cierre-inner">
          <Eyebrow>Hablemos de tu operación</Eyebrow>
          <MaskHeading
            id="abtc-title"
            className="h-sec"
            text="Empecemos con un diagnóstico, **no con una venta.**"
            style={{ marginTop: 18 }}
          />
          <DiagCta />
          <p className="cierre-hint" data-fx="rise">
            Unos minutos. Sin costo. Carlos te contesta directo por WhatsApp.
          </p>
        </div>
      </section>
    </div>
  );
}
