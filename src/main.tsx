import { StrictMode, type ComponentType } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/outfit';
import './styles/global.css';
import './styles/landing.css';
import './styles/site.css';
import './styles/home.css';
import './styles/clinicas.css';
import './styles/demo.css';
import './styles/paginas.css';
import './styles/diagnostic.css';
import './styles/consent.css';
import App from './App';
import { defForPath, keyForDef } from './routes';
import { initAnalytics } from './lib/analytics';

initAnalytics();

const container = document.getElementById('root')!;

function montar(resolved?: Map<string, ComponentType>) {
  const app = (
    <StrictMode>
      <BrowserRouter>
        <App resolved={resolved} />
      </BrowserRouter>
    </StrictMode>
  );

  /* Las páginas llegan prerenderizadas desde el build: hay que hidratar el
     HTML existente en lugar de tirarlo y volver a pintarlo. En `vite dev`
     el contenedor está vacío y se monta de forma normal. */
  if (container.firstElementChild) hydrateRoot(container, app);
  else createRoot(container).render(app);
}

/**
 * Salvo la Home, las páginas se cargan con `React.lazy`. Eso es correcto al
 * navegar, pero NO en la primera pintura de una página prerenderizada: el
 * chunk todavía no ha llegado, `Suspense` pinta su fallback vacío y React
 * ve un árbol que no coincide con el HTML del build. El resultado es que
 * descarta el prerender entero y vuelve a pintar en cliente — justo lo que
 * el prerender venía a evitar.
 *
 * Por eso se resuelve por adelantado SOLO el módulo de la ruta actual: es
 * el que hace falta de inmediato, así que no cuesta nada extra, y el
 * code-splitting del resto del sitio queda intacto.
 */
const def = container.firstElementChild ? defForPath(location.pathname) : undefined;

if (def?.load) {
  def
    .load()
    .then((mod) => montar(new Map([[keyForDef(def), mod.default]])))
    /* Si el chunk no carga, se monta igual: React rehará el árbol en
       cliente (lo que ya ocurría) en vez de dejar la página en blanco. */
    .catch(() => montar());
} else {
  montar();
}
