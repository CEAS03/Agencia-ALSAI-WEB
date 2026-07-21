import { Eyebrow, MaskHeading } from '../../components/ui/primitives';
import { site } from '../../config/site';
import { IconPin } from '../../components/icons';

/**
 * SECCIONES 9 y 10 — Método ALSAI y teaser de Nosotros.
 * El método usa la capa 2 (línea que se dibuja + pasos escalonados);
 * el teaser reutiliza la FounderCard de la tarjeta original.
 */

const PASOS = [
  { name: 'Diagnosticar', body: 'Entendemos cómo entra, avanza y se pierde cada oportunidad en tu operación real.' },
  { name: 'Priorizar', body: 'Elegimos juntos las fugas que más cuestan y el orden en que conviene atacarlas.' },
  { name: 'Diseñar', body: 'Definimos el sistema a la medida: módulos, flujos, mensajes y responsables.' },
  { name: 'Implementar', body: 'Configuramos y conectamos todo por fases, sin detener tu operación diaria.' },
  { name: 'Medir y optimizar', body: 'Con datos reales, ajustamos lo que haga falta para que el sistema mejore cada mes.' },
];

export function MetodoNosotros() {
  return (
    <>
      {/* ── 9 · Método ── */}
      <section className="site-sec" aria-labelledby="met-title">
        <div className="site-shell">
          <Eyebrow>Método ALSAI</Eyebrow>
          <MaskHeading
            id="met-title"
            className="h-sec"
            text="Cómo lo construimos **contigo.**"
            style={{ marginTop: 18 }}
          />

          <div className="met-steps">
            <span className="met-line" data-fx="draw" aria-hidden="true" />
            <div style={{ display: 'contents' }} data-fx-group>
              {PASOS.map((p, i) => (
                <div className="met-step" key={p.name}>
                  <h3 className="met-name">
                    0{i + 1} · {p.name}
                  </h3>
                  <p className="met-body">{p.body}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="met-outro" data-fx="rise">
            No llegamos con una plantilla cerrada. Construimos el sistema alrededor de la operación
            real de tu negocio.
          </p>
        </div>
      </section>

      {/* ── 10 · Nosotros (teaser) ── */}
      <section className="site-sec" aria-labelledby="nos-title">
        <div className="site-shell">
          <Eyebrow>Nosotros</Eyebrow>
          <MaskHeading
            id="nos-title"
            className="h-sec nos-quote"
            text="La tecnología solo genera valor cuando **mejora la forma** en que un negocio atrae, atiende, decide y opera."
            style={{ marginTop: 18 }}
          />

          <div className="nos-row">
            <div data-fx="rise">
              {/* Tarjeta del fundador: mismas clases visuales que la tarjeta original. */}
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
            </div>
            <div className="nos-note" data-fx="rise" data-fx-delay="0.12">
              <p>
                Detrás de ALSAI hay un equipo pequeño en Querétaro, fundado por Carlos Álvarez, que
                construye lo que vende: los mismos sistemas que implementamos para clientes
                sostienen nuestra propia operación — y este sitio.
              </p>
              <span className="chip">Conoce más sobre nosotros · Próximamente</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
