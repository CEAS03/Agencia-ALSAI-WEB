import { Eyebrow, MaskHeading } from '../../components/ui/primitives';
import { Accordion, type AccordionItem } from '../../components/ui/Accordion';
import { DiagCta } from '../../components/ui/buttons';
import { FAQS as FAQ_ENTRIES } from '../../content/faq';

/**
 * SECCIONES 11 y 12 — Preguntas frecuentes y cierre con diagnóstico.
 * Respuestas honestas y prudentes: sin precios, sin promesas de plazos.
 */

/* El texto vive en content/faq.ts: el schema FAQPage lo lee de ahí mismo. */
const FAQS: AccordionItem[] = FAQ_ENTRIES;

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
