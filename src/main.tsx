import { StrictMode } from 'react';
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
import App from './App';
import { initAnalytics } from './lib/analytics';

initAnalytics();

const container = document.getElementById('root')!;

const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

/* Las páginas llegan prerenderizadas desde el build: hay que hidratar el HTML
   existente en lugar de tirarlo y volver a pintarlo. En `vite dev` el
   contenedor está vacío y se monta de forma normal. */
if (container.firstElementChild) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
