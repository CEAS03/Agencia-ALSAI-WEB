import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { EcosystemBackground } from '../../scene/EcosystemBackground';
import { revealEco } from '../../scene/ecosystem';
import { DiagnosticOverlay } from '../../diagnostic/DiagnosticOverlay';
import { useDiagnostic } from '../../diagnostic/useDiagnostic';
import { Toaster } from '../../lib/toast';
import { track } from '../../lib/analytics';
import { TransitionProvider } from './PageTransition';
import { DiagnosticContext } from '../ui/buttons';
import { NavBar } from './NavBar';
import { SiteFooter } from './SiteFooter';
import { CursorHalo } from './CursorHalo';

/**
 * Layout raíz: el fondo WebGL vive aquí, montado UNA sola vez, para que
 * persista entre páginas (continuidad visual). Nav, footer, overlay del
 * diagnóstico y transición "A" envuelven a todas las rutas.
 */
export function Layout() {
  const diagnostic = useDiagnostic();
  const location = useLocation();

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
          <CursorHalo />
          <NavBar />
          <main id="contenido">
            <Outlet />
          </main>
          <SiteFooter />
          <DiagnosticOverlay controller={diagnostic} />
          <Toaster />
        </DiagnosticContext.Provider>
      </TransitionProvider>
    </>
  );
}
