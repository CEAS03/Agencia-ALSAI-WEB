import { useEffect, useRef } from 'react';
import { site } from '../../config/site';
import { track } from '../../lib/analytics';
import { toast } from '../../lib/toast';
import { saveFounderContact } from '../../lib/vcard';
import { FounderCard } from '../FounderCard';
import { IconContact, IconPulse } from '../icons';

/**
 * SECCIÓN 5 — Cierre.
 * Orden: promesa → CTA de diagnóstico → quién está detrás (tarjeta del
 * fundador) → guardar contacto. Los íconos de ambos botones llevan una
 * animación continua, definida en sections.css y limitada a `.fc` para no
 * tocar el hero.
 */

interface FinalCtaProps {
  onOpenDiagnostic: (originRect: DOMRect) => void;
}

export function FinalCta({ onOpenDiagnostic }: FinalCtaProps) {
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    ctaRef.current?.classList.add('is-live');
  }, []);

  const handleDiagnostic = () => {
    const rect = ctaRef.current?.getBoundingClientRect();
    if (rect) onOpenDiagnostic(rect);
  };

  const handleSaveContact = () => {
    track('contact_save_clicked');
    if (!saveFounderContact()) {
      toast('El contacto directo estará disponible muy pronto');
    }
  };

  return (
    <section className="sec fc shell" aria-labelledby="fc-title">
      <h2 id="fc-title" className="fc-title reveal">
        Ya viste cómo funciona.
        <br />
        Ahora ve qué le falta a tu clínica.
      </h2>

      <div className="fc-actions reveal">
        <button ref={ctaRef} className="cta-primary" onClick={handleDiagnostic}>
          <span className="cta-ring" aria-hidden="true" />
          <span className="cta-glow" aria-hidden="true" />
          <IconPulse className="cta-icon" />
          <span className="cta-label">{site.brand.ctaPrimary}</span>
        </button>

        <p className="fc-note">3 minutos. Sin costo. Sin llamada de ventas.</p>
      </div>

      <FounderCard />

      <div className="fc-save reveal">
        <button className="cta-secondary" onClick={handleSaveContact}>
          <IconContact />
          <span className="fc-save-label">
            Guardar contacto
            <br />
            de Carlos Álvarez
          </span>
        </button>
      </div>
    </section>
  );
}
