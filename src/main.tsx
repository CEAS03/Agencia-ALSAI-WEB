import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
