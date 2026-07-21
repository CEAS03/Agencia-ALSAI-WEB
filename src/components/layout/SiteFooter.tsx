import type { MouseEvent } from 'react';
import { site } from '../../config/site';
import { track } from '../../lib/analytics';
import { toast } from '../../lib/toast';
import { useTransitionNavigate } from './PageTransition';
import { IconInstagram, IconLinkedIn, IconShield, IconWhatsApp } from '../icons';

/**
 * Footer del sitio: marca, navegación, contacto y aviso de privacidad.
 * Los enlaces sin URL configurada (site.ts) avisan "muy pronto" sin romper.
 */
export function SiteFooter() {
  const go = useTransitionNavigate();

  const nav = (e: MouseEvent, to: string) => {
    e.preventDefault();
    go(to);
  };

  const openExternal = (key: 'whatsapp' | 'instagram' | 'linkedin') => {
    const url = site.links[key];
    /* WhatsApp es conversión, no una red social más. */
    if (key === 'whatsapp') track('whatsapp_click', { origen: 'footer' });
    else track('social_clicked', { channel: key });
    if (!url) {
      toast('Este enlace estará disponible muy pronto');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="sfooter">
      <div className="site-shell">
        <div className="sfooter-grid">
          <div className="sfooter-brand">
            <span className="nav-brand" aria-label="Agencia ALSAI">
              <span className="nb-overline">Agencia</span>
              <span>
                ALS<span className="nb-ai">AI</span>
              </span>
              <span className="nb-dot" aria-hidden="true" />
            </span>
            <p className="sfooter-tag">
              Sistemas completos de crecimiento: marketing, IA, WhatsApp, CRM, agenda y seguimiento
              trabajando conectados.
            </p>
          </div>

          <div>
            <h4>Mapa</h4>
            <div className="sfooter-col">
              <a className="sfooter-link" href="/" onClick={(e) => nav(e, '/')}>
                Inicio
              </a>
              <a className="sfooter-link" href="/soluciones" onClick={(e) => nav(e, '/soluciones')}>
                Soluciones
              </a>
              <a className="sfooter-link" href="/clinicas" onClick={(e) => nav(e, '/clinicas')}>
                Clínicas
              </a>
              <a className="sfooter-link" href="/casos" onClick={(e) => nav(e, '/casos')}>
                Casos
              </a>
              <a className="sfooter-link" href="/nosotros" onClick={(e) => nav(e, '/nosotros')}>
                Nosotros
              </a>
              <a className="sfooter-link" href="/diagnostico" onClick={(e) => nav(e, '/diagnostico')}>
                Diagnóstico
              </a>
            </div>
          </div>

          <div>
            <h4>Contacto</h4>
            <div className="sfooter-col">
              <button className="sfooter-link" onClick={() => openExternal('whatsapp')}>
                <IconWhatsApp />
                WhatsApp
              </button>
              <button className="sfooter-link" onClick={() => openExternal('instagram')}>
                <IconInstagram />
                Instagram
              </button>
              <button className="sfooter-link" onClick={() => openExternal('linkedin')}>
                <IconLinkedIn />
                LinkedIn
              </button>
              <a
                className="sfooter-link"
                href="/aviso-de-privacidad"
                onClick={(e) => nav(e, '/aviso-de-privacidad')}
              >
                <IconShield />
                Aviso de privacidad
              </a>
            </div>
          </div>
        </div>

        <div className="sfooter-base">
          <span>
            © {new Date().getFullYear()} {site.brand.name} · Querétaro, México
          </span>
          <span>Este sitio también es nuestro portafolio: lo construimos nosotros.</span>
        </div>
      </div>
    </footer>
  );
}
