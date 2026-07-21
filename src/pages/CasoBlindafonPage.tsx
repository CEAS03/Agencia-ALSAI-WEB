import { useRef } from 'react';
import { usePageFx } from '../lib/motion';
import { track } from '../lib/analytics';
import { Eyebrow, MaskHeading } from '../components/ui/primitives';
import { DiagCta } from '../components/ui/buttons';
import { IconCheck, IconWhatsApp } from '../components/icons';

/**
 * CASO BLINDAFON (/casos/blindafon) — el laboratorio operativo de ALSAI.
 * Diferenciador único: el bot es real y el visitante puede probarlo AHORA.
 * Sin métricas inventadas: los resultados se marcan [PENDIENTE].
 */

const BLINDAFON_LINK = 'https://wa.link/8bupop';

const CHIPS = ['¿Cuánto cuesta?', '¿Tienen promoción?', '¿Van a domicilio?', '¿Cuánto dura?'];

const IMPLEMENTADO = [
  {
    t: 'Captación con campañas y promociones',
    b: 'Campañas locales y ofertas de temporada que llevan la conversación directo a WhatsApp.',
  },
  {
    t: 'Agente de IA en WhatsApp',
    b: 'Responde precios, promociones, cobertura a domicilio y duración del servicio; agenda sin intervención humana.',
  },
  {
    t: 'Agenda y confirmaciones',
    b: 'Cada servicio agendado recibe confirmación y recordatorio automáticos.',
  },
  {
    t: 'CRM y seguimiento',
    b: 'Todo contacto queda registrado con origen y etapa; los interesados que no cierran reciben seguimiento.',
  },
  {
    t: 'Medición de la operación',
    b: 'Qué campaña trae conversaciones y cuáles terminan en servicios: visible en un tablero.',
  },
];

const FASES = [
  { t: 'Operación manual', b: 'Blindafon nació como cualquier negocio: WhatsApp personal, agenda de papel y memoria.' },
  { t: 'Primeros módulos', b: 'Agente de WhatsApp + agenda conectada: la atención dejó de depender de estar disponible.' },
  { t: 'Sistema completo', b: 'Captación, CRM, seguimiento y medición conectados: el mismo sistema que implementamos a clientes.' },
  { t: 'Laboratorio permanente', b: 'Cada mejora nueva se prueba aquí primero, con dinero y clientes reales, antes de ofrecerla.' },
];

export default function CasoBlindafonPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  usePageFx(rootRef);

  return (
    <div ref={rootRef}>
      {/* ── Hero ── */}
      <section className="cd-hero site-sec" aria-labelledby="bf-title">
        <div className="site-shell">
          <div className="cd-chips" data-fx="rise">
            <span className="chip">Caso</span>
            <span className="chip chip--on">Sistema activo</span>
            <span className="chip">Nanotecnología · Querétaro</span>
          </div>
          <MaskHeading
            as="h1"
            id="bf-title"
            className="h-display"
            text="Blindafon: **nuestro laboratorio operativo.**"
          />
          <p className="t-lead" data-fx="rise">
            No te vendemos teoría: implementamos en tu negocio lo que ya funciona en el nuestro.
            Blindafon es un servicio real de nanotecnología — un blindaje líquido invisible que
            protege teléfonos contra golpes y rayones — y también el campo de pruebas de cada
            sistema ALSAI.
          </p>
        </div>
      </section>

      {/* ── Por qué existe ── */}
      <section className="site-sec" aria-labelledby="bfw-title">
        <div className="site-shell cd-block">
          <Eyebrow>Por qué un laboratorio propio</Eyebrow>
          <MaskHeading
            id="bfw-title"
            as="h2"
            className="h-sec"
            text="Probamos con **nuestro dinero,** no con el tuyo."
            style={{ marginTop: 18 }}
          />
          <p className="t-body" data-fx="rise">
            Cada estrategia, automatización o flujo que ofrecemos pasó primero por Blindafon: si
            una idea no sobrevive a la operación real — clientes impacientes, horarios pico,
            promociones, cancelaciones — no llega a ningún cliente de ALSAI. Así de simple.
          </p>
        </div>
      </section>

      {/* ── Qué está implementado ── */}
      <section className="site-sec" aria-labelledby="bfi-title">
        <div className="site-shell cd-block">
          <Eyebrow>Qué corre hoy</Eyebrow>
          <MaskHeading
            id="bfi-title"
            as="h2"
            className="h-sec"
            text="El sistema completo, **en producción.**"
            style={{ marginTop: 18 }}
          />
          <ul className="cd-done" data-fx-group>
            {IMPLEMENTADO.map((item) => (
              <li key={item.t}>
                <span className="cdd-ico" aria-hidden="true">
                  <IconCheck />
                </span>
                <p>
                  <strong>{item.t}</strong>
                  {item.b}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Evolución ── */}
      <section className="site-sec" aria-labelledby="bff-title">
        <div className="site-shell">
          <Eyebrow>Evolución</Eyebrow>
          <MaskHeading
            id="bff-title"
            as="h2"
            className="h-sec"
            text="De agenda de papel **a sistema conectado.**"
            style={{ marginTop: 18 }}
          />
          <div className="impl-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }} data-fx-group>
            {FASES.map((f) => (
              <div className="impl-step" key={f.t}>
                <h3>{f.t}</h3>
                <p>{f.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Resultados (honesto) ── */}
      <section className="site-sec" aria-labelledby="bfr-title">
        <div className="site-shell cd-block">
          <Eyebrow>Resultados</Eyebrow>
          <MaskHeading
            id="bfr-title"
            as="h2"
            className="h-sec"
            text="Los números, **cuando sean publicables.**"
            style={{ marginTop: 18 }}
          />
          <div className="cd-honest" data-fx="rise">
            <span className="pend">[PENDIENTE: métricas reales autorizadas para publicación]</span>
            <p>
              Preferimos un espacio vacío antes que un número inventado. Mientras preparamos las
              cifras publicables, la mejor prueba está a un clic: el bot de Blindafon atiende en
              vivo, ahora mismo.
            </p>
          </div>
        </div>
      </section>

      {/* ── Prueba el bot (en vivo) ── */}
      <section className="site-sec" aria-labelledby="bfb-title">
        <div className="site-shell cd-block">
          <Eyebrow>La prueba que nadie puede copiar</Eyebrow>
          <MaskHeading
            id="bfb-title"
            as="h2"
            className="h-sec"
            text="Habla con el bot de Blindafon **ahora mismo.**"
            style={{ marginTop: 18 }}
          />
          <div className="cd-bot" data-fx="rise">
            <a
              className="cd-bot-btn"
              href={BLINDAFON_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_click', { origen: 'caso-blindafon' })}
              data-cursor="hot"
            >
              <IconWhatsApp />
              Abrir WhatsApp de Blindafon
            </a>
            <div>
              <p className="t-body">
                Es el mismo agente que atiende a sus clientes reales. Pregúntale lo que sea acerca
                del negocio:
              </p>
              <div className="cd-bot-chips" aria-hidden="true">
                {CHIPS.map((chip) => (
                  <span className="chip" key={chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cierre ── */}
      <section className="site-sec cierre" aria-labelledby="bfc-title">
        <span className="cierre-glow" aria-hidden="true" />
        <div className="site-shell cierre-inner">
          <Eyebrow>Tu negocio puede operar así</Eyebrow>
          <MaskHeading
            id="bfc-title"
            className="h-sec"
            text="Lo que funciona en Blindafon, **adaptado a tu operación.**"
            style={{ marginTop: 18 }}
          />
          <DiagCta />
          <p className="cierre-hint" data-fx="rise">
            Unos minutos. Sin costo. El siguiente paso se conversa por WhatsApp.
          </p>
        </div>
      </section>
    </div>
  );
}
