import { Eyebrow, MaskHeading, ArrowLink } from '../../components/ui/primitives';
import { useTransitionNavigate } from '../../components/layout/PageTransition';

/**
 * SECCIONES 6 y 7 — ALSAI para clínicas (teaser) y otros negocios.
 * Aquí el lenguaje cambia de "cliente" a "paciente" en el bloque clínico.
 */

const ESCENARIOS = [
  {
    title: 'Inmobiliaria',
    body: 'Cada interesado en una propiedad recibe respuesta al momento, se registra en el CRM y llega al asesor correcto con todo su contexto.',
    icon: 'M4 19.6V9.8L12 4l8 5.8v9.8M9.4 19.6v-5.4h5.2v5.4M2.8 19.6h18.4',
  },
  {
    title: 'Comercio',
    body: 'Las preguntas por WhatsApp se convierten en pedidos y datos: inventario consultado, pago coordinado y seguimiento postventa automático.',
    icon: 'M5 8h14l-1.2 11a1.6 1.6 0 0 1-1.6 1.4H7.8A1.6 1.6 0 0 1 6.2 19L5 8ZM8.6 8V6.4a3.4 3.4 0 0 1 6.8 0V8',
  },
  {
    title: 'Servicios profesionales',
    body: 'Despachos y consultorías califican prospectos, agendan reuniones y dan seguimiento a propuestas sin perseguir hojas de cálculo.',
    icon: 'M7 7.6V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.6M4 7.6h16a1 1 0 0 1 1 1V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.6a1 1 0 0 1 1-1ZM3 12.4h18M12 11v2.8',
  },
];

export function Sectores() {
  const go = useTransitionNavigate();

  return (
    <>
      {/* ── 6 · Teaser clínicas ── */}
      <section className="site-sec" aria-labelledby="tcl-title">
        <div className="site-shell">
          <div className="tcl-card" data-fx="rise">
            <span className="tcl-beam" aria-hidden="true" />
            <Eyebrow>ALSAI para clínicas</Eyebrow>
            <MaskHeading
              id="tcl-title"
              className="h-sec"
              text="Tu clínica cuida pacientes. **Nosotros hacemos que todo lo demás funcione.**"
              style={{ marginTop: 16 }}
            />
            <p className="t-lead tcl-copy" data-fx="rise">
              De la primera consulta por WhatsApp a la cita confirmada, el recordatorio y el
              seguimiento del tratamiento: cada paciente recibe atención continua y tu equipo
              trabaja con menos carga.
            </p>
            <ArrowLink onClick={() => go('/clinicas')}>Ver soluciones para clínicas</ArrowLink>
          </div>
        </div>
      </section>

      {/* ── 7 · Otros negocios ── */}
      <section className="site-sec" aria-labelledby="oth-title">
        <div className="site-shell">
          <Eyebrow>Adaptable a tu operación</Eyebrow>
          <MaskHeading
            id="oth-title"
            className="h-sec"
            text="¿No tienes una clínica? **El sistema funciona igual.**"
            style={{ marginTop: 18 }}
          />

          <div className="oth-grid" data-fx-group>
            {ESCENARIOS.map((e) => (
              <article className="g-card oth-card" key={e.title}>
                <span className="mod-icon" style={{ marginTop: 0, paddingTop: 0, paddingBottom: 14 }} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d={e.icon} />
                  </svg>
                </span>
                <h3 className="mod-title">{e.title}</h3>
                <p className="mod-body">{e.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
