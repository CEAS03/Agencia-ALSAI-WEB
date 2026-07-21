import type { ReactNode } from 'react';
import { site } from '../config/site';
import { track } from '../lib/analytics';
import { toast } from '../lib/toast';
import { IconGlobe, IconInstagram, IconLinkedIn, IconShield, IconWhatsApp } from './icons';

interface LinkDef {
  key: 'website' | 'instagram' | 'linkedin' | 'whatsapp';
  label: string;
  icon: ReactNode;
}

/** El sitio es la acción destacada; las redes van como accesos compactos. */
const SOCIALS: LinkDef[] = [
  { key: 'instagram', label: 'Instagram', icon: <IconInstagram /> },
  { key: 'linkedin', label: 'LinkedIn', icon: <IconLinkedIn /> },
  { key: 'whatsapp', label: 'WhatsApp', icon: <IconWhatsApp /> },
];

export function Footer() {
  const open = (def: LinkDef) => {
    const url = site.links[def.key];
    track(def.key === 'website' ? 'website_clicked' : 'social_clicked', { channel: def.key });
    if (!url) {
      toast('Este enlace estará disponible muy pronto');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openPrivacy = () => {
    if (!site.links.privacy) {
      toast('El aviso de privacidad estará disponible muy pronto');
      return;
    }
    window.open(site.links.privacy, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="footer shell">
      <p className="microlabel reveal">Encuéntranos</p>

      <button
        className="site-button reveal"
        onClick={() => open({ key: 'website', label: 'Sitio', icon: <IconGlobe /> })}
      >
        <IconGlobe />
        Visitar sitio oficial
      </button>

      <div className="footer-links reveal">
        {SOCIALS.map((def) => (
          <button key={def.key} className="link-tile" onClick={() => open(def)}>
            {def.icon}
            {def.label}
          </button>
        ))}
      </div>

      <button className="footer-privacy reveal" onClick={openPrivacy}>
        <IconShield />
        Aviso de privacidad
      </button>

      <p className="footer-copy reveal">
        © {new Date().getFullYear()} {site.brand.name} · Querétaro, México
      </p>
    </footer>
  );
}
