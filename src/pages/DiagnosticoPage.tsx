import { useEffect, useRef, type MouseEvent } from 'react';
import { usePageFx } from '../lib/motion';
import { Eyebrow, MaskHeading } from '../components/ui/primitives';
import { DiagCta, useOpenDiagnostic } from '../components/ui/buttons';
import { useTransitionNavigate } from '../components/layout/PageTransition';

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

/* Las seis etapas que puntúa el motor (src/diagnostic/engine/scoring.ts).
   Describirlas aquí le da a la página el contenido que le faltaba y explica
   de verdad qué mide el diagnóstico antes de pedir un solo dato. */
const ETAPAS = [
  {
    t: 'Captación',
    b: 'De dónde llegan tus pacientes o clientes, cuánto cuesta cada uno y si sabes qué campaña los trajo.',
  },
  {
    t: 'Respuesta',
    b: 'Cuánto tarda tu negocio en contestar un mensaje de WhatsApp y qué pasa fuera del horario de atención.',
  },
  {
    t: 'Agenda',
    b: 'Cómo se agendan las citas, si el proceso depende de una persona y cuántas se pierden en el intento.',
  },
  {
    t: 'Asistencia',
    b: 'Cuántos confirman y se presentan, y si hay recordatorios automáticos sosteniendo esa cifra.',
  },
  {
    t: 'Conversión',
    b: 'Qué ocurre con un presupuesto presentado: si queda registrado con etapa, responsable y próxima acción.',
  },
  {
    t: 'Recuperación',
    b: 'Qué haces con los pacientes que no volvieron y con los tratamientos que quedaron pendientes.',
  },
];

export default function DiagnosticoPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  usePageFx(rootRef);
  const open = useOpenDiagnostic();
  const opened = useRef(false);
  const go = useTransitionNavigate();

  /* Enlaces internos reales: el href queda en el HTML para que Google lo
     siga, y el clic navega con la transición del sitio. */
  const nav = (e: MouseEvent, to: string) => {
    e.preventDefault();
    go(to);
  };

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

          <DiagCta origen="diagnostico-hero">Iniciar diagnóstico</DiagCta>
          <p className="cierre-hint" data-fx="rise">
            Unos minutos · tus respuestas se analizan al momento.
          </p>
        </div>
      </section>

      <section className="site-sec" aria-labelledby="dg-etapas">
        <div className="site-shell">
          <MaskHeading
            as="h2"
            id="dg-etapas"
            className="h-sec"
            text="Qué revisa el diagnóstico: **seis etapas** del recorrido."
          />
          <p className="t-lead" data-fx="rise">
            El análisis recorre el camino completo de una oportunidad, desde que alguien te
            encuentra hasta que vuelve. En cada etapa marca si funciona, si está en riesgo o si
            hay una fuga, y estima cuánto dinero representa.
          </p>

          <div className="dg-grid" data-fx-group>
            {ETAPAS.map((e, i) => (
              <div className="dg-item" key={e.t}>
                <span className="dg-num">0{i + 1}</span>
                <div>
                  <h3>{e.t}</h3>
                  <p>{e.b}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="t-lead" data-fx="rise">
            Si trabajas en el sector salud, la versión para{' '}
            <a href="/clinicas" onClick={(e) => nav(e, '/clinicas')}>
              clínicas dentales, estéticas y de salud
            </a>{' '}
            explica cómo se automatizan las citas, el seguimiento y la recuperación de pacientes.
            También puedes ver{' '}
            <a href="/soluciones" onClick={(e) => nav(e, '/soluciones')}>
              las seis piezas del sistema
            </a>{' '}
            que resuelven cada etapa.
          </p>
        </div>
      </section>
    </div>
  );
}
