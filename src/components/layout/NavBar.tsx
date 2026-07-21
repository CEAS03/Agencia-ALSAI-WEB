import { useEffect, useState, type MouseEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useTransitionNavigate } from './PageTransition';
import { useOpenDiagnostic } from '../ui/buttons';
import { IconPulse } from '../icons';

interface NavItem {
  to: string;
  label: string;
}

const LINKS: NavItem[] = [
  { to: '/', label: 'Inicio' },
  { to: '/soluciones', label: 'Soluciones' },
  { to: '/clinicas', label: 'Clínicas' },
  { to: '/casos', label: 'Casos' },
  { to: '/nosotros', label: 'Nosotros' },
];

/** Activo exacto para la raíz; por prefijo para el resto (/casos/…). */
function isActive(pathname: string, to: string): boolean {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(to + '/');
}

export function NavBar() {
  const go = useTransitionNavigate();
  const { pathname } = useLocation();
  const openDiagnostic = useOpenDiagnostic();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* El menú bloquea el scroll del fondo mientras está abierto. */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleNav = (e: MouseEvent, to: string) => {
    e.preventDefault();
    setMenuOpen(false);
    go(to);
  };

  const handleCta = (e: MouseEvent<HTMLButtonElement>) => {
    setMenuOpen(false);
    openDiagnostic(e.currentTarget.getBoundingClientRect());
  };

  return (
    <>
      <header className={`nav${scrolled ? ' is-scrolled' : ''}`}>
        <div className="site-shell nav-inner">
          <a className="nav-brand" href="/" onClick={(e) => handleNav(e, '/')} aria-label="Agencia ALSAI — Inicio">
            <span className="nb-overline">Agencia</span>
            <span>
              ALS<span className="nb-ai">AI</span>
            </span>
            <span className="nb-dot" aria-hidden="true" />
          </a>

          <nav className="nav-links" aria-label="Navegación principal">
            {LINKS.map((l) => (
              <a
                key={l.to}
                href={l.to}
                className={`nav-link${isActive(pathname, l.to) ? ' is-active' : ''}`}
                onClick={(e) => handleNav(e, l.to)}
              >
                {l.label}
              </a>
            ))}
            <button className="nav-cta" onClick={handleCta} data-cursor="hot">
              <IconPulse />
              Iniciar diagnóstico
            </button>
          </nav>

          <button
            className={`nav-burger${menuOpen ? ' is-open' : ''}`}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Menú móvil a pantalla completa */}
      <div className={`nav-menu${menuOpen ? ' is-open' : ''}`} aria-hidden={!menuOpen}>
        <nav aria-label="Navegación móvil">
          {[...LINKS, { to: '/diagnostico', label: 'Diagnóstico' }].map((l, i) => (
            <a
              key={l.to}
              href={l.to}
              className={`nm-link${isActive(pathname, l.to) ? ' is-active' : ''}`}
              style={{ transitionDelay: menuOpen ? `${70 + i * 60}ms` : '0ms' }}
              onClick={(e) => handleNav(e, l.to)}
              tabIndex={menuOpen ? 0 : -1}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nm-foot">
          <button className="nav-cta" onClick={handleCta} tabIndex={menuOpen ? 0 : -1}>
            <IconPulse />
            Iniciar diagnóstico
          </button>
        </div>
      </div>
    </>
  );
}
