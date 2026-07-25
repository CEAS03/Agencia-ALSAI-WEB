import { useEffect, useRef, useState } from 'react';
import { site } from '../config/site';
import { applyConsent } from '../lib/analytics';
import { readConsent, saveConsent, type ConsentDecision } from '../lib/consent';

/**
 * Aviso de cookies. Solo aparece si no hay decisión previa.
 *
 * No bloquea la página: el diagnóstico y la navegación funcionan igual con
 * o sin aceptar. Rechazar es tan fácil como aceptar (mismo peso visual),
 * que es justo lo que exige un consentimiento válido.
 */
export function ConsentBanner() {
  /* Arranca oculto y decide en efecto: en el HTML prerenderizado no existe
     `localStorage`, y pintarlo en servidor causaría un parpadeo a quien ya
     decidió. */
  const [visible, setVisible] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (readConsent() === null) setVisible(true);
  }, []);

  /**
   * Publica la altura real del aviso en `--consent-h`. El aviso flota sobre
   * el overlay del diagnóstico (ver consent.css), así que sin esta medida
   * tapaba el botón "Recibir mi diagnóstico" y dejaba el formulario sin
   * enviar. `.diag-content` la suma a su espacio inferior.
   *
   * Se mide en vez de codificar un número porque la altura cambia con el
   * ancho, el tamaño de letra del navegador y la longitud del texto.
   */
  useEffect(() => {
    const caja = cajaRef.current;
    const raiz = document.documentElement;
    if (!visible || !caja) {
      raiz.style.removeProperty('--consent-h');
      return;
    }

    const publica = () => {
      /* 16px de respiro para que el botón no quede pegado al aviso. */
      raiz.style.setProperty('--consent-h', `${caja.offsetHeight + 16}px`);
    };
    publica();

    const ro = new ResizeObserver(publica);
    ro.observe(caja);
    return () => {
      ro.disconnect();
      raiz.style.removeProperty('--consent-h');
    };
  }, [visible]);

  const decide = (decision: ConsentDecision) => {
    saveConsent(decision);
    applyConsent(decision);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      ref={cajaRef}
      className="cookie-consent"
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
    >
      <p className="consent-copy">
        Usamos cookies para medir cómo se usa el sitio y mejorar nuestras campañas. Puedes
        aceptarlas o seguir solo con las necesarias.{' '}
        <a href={site.links.privacy}>Aviso de privacidad</a>
      </p>
      <div className="consent-actions">
        <button type="button" className="consent-btn ghost" onClick={() => decide('denied')}>
          Solo lo necesario
        </button>
        <button type="button" className="consent-btn primary" onClick={() => decide('granted')}>
          Aceptar
        </button>
      </div>
    </div>
  );
}
