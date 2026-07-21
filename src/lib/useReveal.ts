import { useEffect } from 'react';

/**
 * Revela elementos `.reveal` al entrar en viewport (una sola vez).
 * Se usa un único IntersectionObserver para toda la página.
 */
export function useReveal(): void {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.15 },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/**
 * Se llama durante el render (PageTransition, HeroHome), así que tiene que
 * sobrevivir al prerender en Node, donde no existe `window`. Sin navegador
 * asumimos movimiento normal: el cliente vuelve a evaluarlo al hidratar.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
