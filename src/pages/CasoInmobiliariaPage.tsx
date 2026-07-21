import { useRef } from 'react';
import { usePageFx } from '../lib/motion';
import { Eyebrow, MaskHeading } from '../components/ui/primitives';
import { DiagCta } from '../components/ui/buttons';
import { IconCheck } from '../components/icons';

/**
 * CASO INMOBILIARIO (/casos/inmobiliaria) — en implementación.
 * El nombre comercial se publica solo con autorización del cliente;
 * mientras tanto, marcador [PENDIENTE] visible y estado real por módulo.
 */

const MODULOS: { t: string; b: string; done: boolean }[] = [
  {
    t: 'Captación multicanal',
    b: 'Campañas y presencia digital que concentran el interés por las propiedades en un solo embudo.',
    done: true,
  },
  {
    t: 'Atención inmediata con IA',
    b: 'Cada interesado recibe respuesta al momento: información de la propiedad, requisitos y siguiente paso.',
    done: true,
  },
  {
    t: 'Distribución a asesores',
    b: 'Las oportunidades calificadas llegan al asesor correcto con todo su contexto, sin repartos a ciegas.',
    done: false,
  },
  {
    t: 'CRM con pipeline inmobiliario',
    b: 'Etapas desde el primer contacto hasta el cierre, con visibilidad de cada oportunidad y su responsable.',
    done: false,
  },
  {
    t: 'Medición del ecosistema',
    b: 'Qué canal produce interesados reales y dónde se detienen: tablero para decidir con datos.',
    done: false,
  },
];

export default function CasoInmobiliariaPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  usePageFx(rootRef);

  return (
    <div ref={rootRef}>
      {/* ── Hero ── */}
      <section className="cd-hero site-sec" aria-labelledby="in-title">
        <div className="site-shell">
          <div className="cd-chips" data-fx="rise">
            <span className="chip">Caso</span>
            <span className="chip">En implementación</span>
            <span className="pend">[PENDIENTE: autorización de nombre]</span>
          </div>
          <MaskHeading
            as="h1"
            id="in-title"
            className="h-display"
            text="Un ecosistema para captar, atender y **distribuir oportunidades.**"
          />
          <p className="t-lead" data-fx="rise">
            Proyecto inmobiliario en Querétaro: un sistema digital conectado donde cada interesado
            en una propiedad recibe atención inmediata y cada asesor recibe oportunidades con
            contexto, no listas frías.
          </p>
        </div>
      </section>

      {/* ── El reto ── */}
      <section className="site-sec" aria-labelledby="inr-title">
        <div className="site-shell cd-block">
          <Eyebrow>El reto</Eyebrow>
          <MaskHeading
            id="inr-title"
            as="h2"
            className="h-sec"
            text="Mucho interés, **poca continuidad.**"
            style={{ marginTop: 18 }}
          />
          <p className="t-body" data-fx="rise">
            En el sector inmobiliario el interés llega por muchos canales — portales, redes,
            anuncios, referidos — y se enfría en horas. Sin un sistema, cada asesor persigue sus
            propios mensajes, nadie ve el panorama completo y las oportunidades se pierden entre
            teléfonos personales.
          </p>
        </div>
      </section>

      {/* ── Estado por módulo ── */}
      <section className="site-sec" aria-labelledby="inm-title">
        <div className="site-shell cd-block">
          <Eyebrow>Estado real del proyecto</Eyebrow>
          <MaskHeading
            id="inm-title"
            as="h2"
            className="h-sec"
            text="Qué está activo y **qué viene en camino.**"
            style={{ marginTop: 18 }}
          />
          <ul className="cd-done" data-fx-group>
            {MODULOS.map((m) => (
              <li key={m.t} className={m.done ? '' : 'is-pending'}>
                <span className="cdd-ico" aria-hidden="true">
                  {m.done ? (
                    <IconCheck />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                      <path d="M12 7v5l3 2" />
                      <circle cx="12" cy="12" r="8.2" />
                    </svg>
                  )}
                </span>
                <p>
                  <strong>
                    {m.t}
                    {!m.done && ' · en implementación'}
                  </strong>
                  {m.b}
                </p>
              </li>
            ))}
          </ul>
          <div className="cd-honest" data-fx="rise" style={{ marginTop: 34 }}>
            <p>
              Publicaremos el nombre comercial, las pantallas del sistema y los resultados cuando
              el proyecto esté en operación completa y su dueño lo autorice. Preferimos enseñar
              tarde que presumir de más.
            </p>
          </div>
        </div>
      </section>

      {/* ── Cierre ── */}
      <section className="site-sec cierre" aria-labelledby="inc-title">
        <span className="cierre-glow" aria-hidden="true" />
        <div className="site-shell cierre-inner">
          <Eyebrow>¿Operas un negocio con asesores o sucursales?</Eyebrow>
          <MaskHeading
            id="inc-title"
            className="h-sec"
            text="El mismo sistema **se adapta a tu operación.**"
            style={{ marginTop: 18 }}
          />
          <DiagCta />
        </div>
      </section>
    </div>
  );
}
