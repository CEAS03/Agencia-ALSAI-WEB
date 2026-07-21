import { IconWhatsApp } from '../icons';
import { track } from '../../lib/analytics';

/**
 * SECCIÓN 3 — Blindafon como prueba.
 * El único diferenciador que nadie puede copiar: un bot real y en vivo que el
 * prospecto puede probar ahora mismo. Sin métricas inventadas.
 */

const BLINDAFON_LINK = 'https://wa.link/8bupop';

const CHIPS = ['¿Cuánto cuesta?', '¿Tienen promoción?', '¿Van a domicilio?', '¿Cuánto dura?'];

export function BlindafonProof() {
  return (
    <section className="sec bf shell" aria-labelledby="bf-title">
      <h2 id="bf-title" className="bf-statement reveal">
        No te vendo teoría. Implemento en tu negocio lo que ya funciona en el mío.
      </h2>

      <p className="bf-context reveal">
        Blindafon es mi laboratorio de pruebas: un servicio de nanotecnología donde aplicamos un
        blindaje líquido invisible que protege teléfonos contra golpes fuertes y rayones.
      </p>

      <p className="bf-context reveal">
        Ahí pruebo cada estrategia, automatización y sistema que desarrollo: desde la captación y la
        atención por WhatsApp hasta las promociones, la agenda y el seguimiento.
      </p>

      <div className="bf-cta-wrap reveal">
        <a
          className="bf-cta"
          href={BLINDAFON_LINK}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('blindafon_bot_clicked')}
        >
          <IconWhatsApp className="bf-cta-icon" />
          <span className="bf-cta-label">
            Habla con el bot de
            <br />
            Blindafon ahora
          </span>
        </a>
      </div>

      <div className="bf-suggest reveal">
        <p className="bf-suggest-lead">Pregúntale lo que sea acerca del negocio.</p>
        <div className="bf-chips" aria-hidden="true">
          {CHIPS.map((chip) => (
            <span className="bf-chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
