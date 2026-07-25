import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { EcosystemBackground } from '../../scene/EcosystemBackground';
import { revealEco } from '../../scene/ecosystem';
import { DiagnosticOverlay } from '../../diagnostic/DiagnosticOverlay';
import { useDiagnostic } from '../../diagnostic/useDiagnostic';
import { Toaster } from '../../lib/toast';
import { track } from '../../lib/analytics';
import { ConsentBanner } from '../ConsentBanner';
import { TransitionProvider } from './PageTransition';
import { DiagnosticContext } from '../ui/buttons';
import { NavBar } from './NavBar';
import { SiteFooter } from './SiteFooter';
import { CursorHalo } from './CursorHalo';
import { useSeo } from '../../seo/useSeo';

/**
 * Layout raíz: el fondo WebGL vive aquí, montado UNA sola vez, para que
 * persista entre páginas (continuidad visual). Nav, footer, overlay del
 * diagnóstico y transición "A" envuelven a todas las rutas.
 */
export function Layout() {
  const diagnostic = useDiagnostic();
  const location = useLocation();

  /* Head (title, canonical, OG, JSON-LD) al navegar dentro del SPA: el HTML
     estático ya trae el correcto en la primera carga. */
  useSeo();

  /* El ecosistema se conecta al entrar, sin importar la ruta inicial. */
  useEffect(() => {
    revealEco();
  }, []);

  useEffect(() => {
    track('page_view', { path: location.pathname });
  }, [location.pathname]);

  return (
    <>
      <EcosystemBackground />
      <div className="eco-vignette" aria-hidden="true" />

      <TransitionProvider>
        <DiagnosticContext.Provider value={{ open: diagnostic.open }}>
          {/* Primer elemento tabulable del documento: salta el menú. */}
          <a className="skip-link" href="#contenido">
            Saltar al contenido
          </a>
          <CursorHalo />
          <NavBar />
          <main id="contenido">
            <Outlet />
          </main>
          <SiteFooter />
          <DiagnosticOverlay controller={diagnostic} />
          <Toaster />
          <ConsentBanner />
        </DiagnosticContext.Provider>
      </TransitionProvider>
    </>
  );
}
