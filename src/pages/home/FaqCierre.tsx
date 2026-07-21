import { Eyebrow, MaskHeading } from '../../components/ui/primitives';
import { Accordion, type AccordionItem } from '../../components/ui/Accordion';
import { DiagCta } from '../../components/ui/buttons';

/**
 * SECCIONES 11 y 12 — Preguntas frecuentes y cierre con diagnóstico.
 * Respuestas honestas y prudentes: sin precios, sin promesas de plazos.
 */

const FAQS: AccordionItem[] = [
  {
    q: '¿ALSAI trabaja únicamente con clínicas?',
    a: 'No. Nos especializamos en clínicas porque conocemos su operación a fondo, pero el mismo sistema funciona para inmobiliarias, comercios y negocios de servicios profesionales. El diagnóstico se adapta a cada operación.',
  },
  {
    q: '¿Necesito cambiar las herramientas que ya uso?',
    a: 'No necesariamente. Primero evaluamos lo que ya tienes: si una herramienta funciona, la conectamos al sistema en lugar de reemplazarla. Solo proponemos cambios cuando hay una razón operativa clara.',
  },
  {
    q: '¿La inteligencia artificial reemplaza a mi equipo?',
    a: 'No. La IA atiende lo repetitivo — responder al instante, recopilar datos, agendar, recordar — y tu equipo conserva las decisiones y el trato humano. Cada flujo define en qué punto interviene una persona.',
  },
  {
    q: '¿Pueden conectar WhatsApp, CRM y agenda?',
    a: 'Sí; esa conexión es el núcleo del sistema. La conversación, el registro del contacto y la cita dejan de vivir en lugares separados: cada mensaje actualiza el CRM y la agenda sin capturas manuales.',
  },
  {
    q: '¿Cuánto tarda una implementación?',
    a: 'Depende de los módulos que tu diagnóstico priorice. Trabajamos por fases para que tu operación nunca se detenga, y el plan con tiempos concretos se define contigo antes de comenzar.',
  },
  {
    q: '¿Qué pasa después de implementar?',
    a: 'El sistema se mide y se optimiza de forma continua: revisamos datos reales, detectamos fugas nuevas y ajustamos flujos. La implementación es el inicio, no el final del trabajo.',
  },
  {
    q: '¿Cómo se protege la información de mi negocio y mis clientes?',
    a: 'La información de tu negocio y de tus clientes sigue siendo tuya. Usamos accesos controlados, cada integración se limita a los datos que necesita y el tratamiento se describe en nuestro aviso de privacidad. No vendemos ni compartimos datos con terceros.',
  },
  {
    q: '¿Qué recibo al terminar el diagnóstico?',
    a: 'Un mapa claro de tus áreas prioritarias: dónde estás perdiendo oportunidades y qué conviene resolver primero. Después continuamos por WhatsApp y, si te interesa, agendamos una reunión estratégica para revisarlo juntos.',
  },
];

export function FaqCierre() {
  return (
    <>
      {/* ── 11 · FAQ ── */}
      <section className="site-sec" aria-labelledby="faq-title">
        <div className="site-shell">
          <div className="faq-grid">
            <div className="faq-sticky">
              <Eyebrow>Preguntas frecuentes</Eyebrow>
              <MaskHeading
                id="faq-title"
                className="h-sec"
                text="Lo que suelen **preguntarnos.**"
                style={{ marginTop: 18 }}
              />
              <p className="t-body" data-fx="rise">
                Respuestas directas, sin letra pequeña. Lo que dependa de tu operación se define en
                el diagnóstico.
              </p>
            </div>
            <Accordion items={FAQS} />
          </div>
        </div>
      </section>

      {/* ── 12 · Cierre ── */}
      <section className="site-sec cierre" aria-labelledby="cierre-title">
        <span className="cierre-glow" aria-hidden="true" />
        <div className="site-shell cierre-inner">
          <Eyebrow>Diagnóstico sin costo</Eyebrow>
          <MaskHeading
            id="cierre-title"
            className="h-sec"
            text="Descubre dónde tu negocio está **perdiendo clientes.**"
            style={{ marginTop: 18 }}
          />
          <p className="t-lead" data-fx="rise">
            En unos minutos, Synthia analiza cómo entran y se pierden tus oportunidades y te
            muestra un mapa con tus áreas prioritarias.
          </p>
          <DiagCta />
          <p className="cierre-hint" data-fx="rise">
            Unos minutos. Sin costo. El siguiente paso se conversa por WhatsApp.
          </p>
        </div>
      </section>
    </>
  );
}
