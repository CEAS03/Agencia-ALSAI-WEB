import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  absoluteUrl,
  buildJsonLd,
  getRouteSeo,
  OG_IMAGE_PATH,
} from './seo.config';

/**
 * Mantiene el <head> sincronizado durante la navegación en cliente.
 *
 * El HTML estático que genera scripts/prerender.mjs ya trae el head correcto
 * de cada ruta — esto es lo que leen Google y los rastreadores sociales. Este
 * hook cubre el caso siguiente: cuando el usuario navega dentro del SPA no hay
 * nueva petición HTTP, así que las etiquetas se reescriben en el sitio.
 */

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSeo(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const route = getRouteSeo(pathname);
    const canonical = absoluteUrl(route.path === '/404' ? pathname : route.path);
    const ogImage = absoluteUrl(OG_IMAGE_PATH);

    document.title = route.title;

    setMeta('meta[name="description"]', 'name', 'description', route.description);
    setMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      route.index === false
        ? 'noindex, follow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    );

    setMeta('meta[property="og:title"]', 'property', 'og:title', route.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', route.description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMeta('meta[property="og:image"]', 'property', 'og:image', ogImage);

    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', route.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', route.description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;

    /* El grafo JSON-LD se reemplaza entero: mezclarlo dejaría nodos huérfanos. */
    let ld = document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (!ld) {
      ld = document.createElement('script');
      ld.type = 'application/ld+json';
      document.head.appendChild(ld);
    }
    ld.textContent = buildJsonLd(route);
  }, [pathname]);
}
