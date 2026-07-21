import type { ComponentType } from 'react';
import HomePage from './pages/HomePage';

/**
 * Tabla de rutas única, compartida por el cliente y el prerender.
 *
 * El cliente envuelve `load` en React.lazy (code-splitting), mientras que
 * scripts/prerender.mjs resuelve el import antes de renderizar: renderToString
 * no sabe esperar a un componente perezoso y devolvería HTML vacío, que es
 * justo lo que veníamos a arreglar.
 *
 * La Home se importa de forma estática a propósito: es la página que más
 * tráfico recibe y así viaja en el chunk principal, sin un salto extra.
 */
export interface RouteDef {
  /** Ruta relativa al Layout. Ausente en la ruta índice. */
  path?: string;
  index?: boolean;
  /** Componente ya cargado (solo la Home). */
  Component?: ComponentType;
  /** Import diferido para el resto. */
  load?: () => Promise<{ default: ComponentType }>;
  /** Módulo fuente, para mapearlo al chunk en el manifest de Vite. */
  src?: string;
}

export const routeDefs: RouteDef[] = [
  { index: true, Component: HomePage },
  {
    path: 'clinicas',
    load: () => import('./pages/ClinicasPage'),
    src: 'src/pages/ClinicasPage.tsx',
  },
  {
    path: 'diagnostico',
    load: () => import('./pages/DiagnosticoPage'),
    src: 'src/pages/DiagnosticoPage.tsx',
  },
  {
    path: 'soluciones',
    load: () => import('./pages/SolucionesPage'),
    src: 'src/pages/SolucionesPage.tsx',
  },
  {
    path: 'casos',
    load: () => import('./pages/CasosPage'),
    src: 'src/pages/CasosPage.tsx',
  },
  {
    path: 'casos/blindafon',
    load: () => import('./pages/CasoBlindafonPage'),
    src: 'src/pages/CasoBlindafonPage.tsx',
  },
  {
    path: 'casos/inmobiliaria',
    load: () => import('./pages/CasoInmobiliariaPage'),
    src: 'src/pages/CasoInmobiliariaPage.tsx',
  },
  {
    path: 'nosotros',
    load: () => import('./pages/NosotrosPage'),
    src: 'src/pages/NosotrosPage.tsx',
  },
  {
    path: 'aviso-de-privacidad',
    load: () => import('./pages/AvisoPrivacidadPage'),
    src: 'src/pages/AvisoPrivacidadPage.tsx',
  },
  {
    path: '*',
    load: () => import('./pages/NotFoundPage'),
    src: 'src/pages/NotFoundPage.tsx',
  },
];

/** Ruta del sitio (‘/clinicas’) → módulo fuente, para el modulepreload. */
export function sourceForPath(pathname: string): string | undefined {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  return routeDefs.find((r) => r.path === clean)?.src;
}
