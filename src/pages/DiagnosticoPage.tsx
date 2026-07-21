import { useEffect, useRef } from 'react';
import { usePageFx } from '../lib/motion';
import { Eyebrow, MaskHeading } from '../components/ui/primitives';
import { DiagCta, useOpenDiagnostic } from '../components/ui/buttons';

/**
 * DIAGNÓSTICO (/diagnostico) — encuadre de agencia para el diagnóstico
 * REUTILIZADO de la tarjeta (overlay + 19 preguntas + n8n/demo intactos).
 * La página abre el overlay automáticamente tras un momento; el fondo
 * queda como contexto al cerrarlo.
 */

const RECIBES = [
  {
    t: 'Un mapa de tus áreas prioritarias',
    b: 'Dónde estás perdiendo oportunidades y qué conviene resolver primero.',
  },
  {
    t: 'Continuación por WhatsApp',
    b: 'Recibes tu diagnóstico y resolvemos dudas directamente, sin formularios eternos.',
  },
  {
    t: 'Reunión estratégica opcional',
    b: 'Si quieres profundizar, agendamos una sesión con Carlos para revisar el plan.',
  },
];

export default function DiagnosticoPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  usePageFx(rootRef);
  const open = useOpenDiagnostic();
  const opened = useRef(false);

  /* Auto-apertura: una sola vez por visita a la página. */
  useEffect(() => {
    if (opened.current) return;
    const t = window.setTimeout(() => {
      opened.current = true;
      open(null);
    }, 650);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <div ref={rootRef}>
      <section className="cl-hero site-sec" aria-labelledby="dg-title">
        <div className="site-shell">
          <Eyebrow>Diagnóstico estratégico</Eyebrow>
          <MaskHeading
            as="h1"
            id="dg-title"
            className="h-display"
            text="Descubre dónde tu negocio está **perdiendo clientes.**"
          />
          <p className="t-lead" data-fx="rise">
            En unos minutos, Synthia — nuestra analista de IA — revisa cómo entran, avanzan y se
            pierden tus oportunidades. Sin costo y sin llamada de ventas.
          </p>

          <div className="dg-grid" data-fx-group>
            {RECIBES.map((r, i) => (
              <div className="dg-item" key={r.t}>
                <span className="dg-num">0{i + 1}</span>
                <div>
                  <h3>{r.t}</h3>
                  <p>{r.b}</p>
                </div>
              </div>
            ))}
          </div>

          <DiagCta>Iniciar diagnóstico</DiagCta>
          <p className="cierre-hint" data-fx="rise">
            Unos minutos · tus respuestas se analizan al momento.
          </p>
        </div>
      </section>
    </div>
  );
}
