import { useEffect, useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './useReveal';

gsap.registerPlugin(ScrollTrigger);

/**
 * Sistema de movimiento del sitio (capa 2 del brief).
 * Un solo hook por página escanea atributos declarativos y monta los
 * ScrollTriggers; el desmontaje limpia todo vía gsap.context.
 *
 *  data-fx="rise"      → fade + subida corta al entrar en viewport
 *  data-fx="draw"      → línea que se dibuja (scaleX desde la izquierda)
 *  data-fx-group       → hijos directos escalonados (stagger ~90 ms)
 *  data-fx-mask        → palabras .mh-word suben desde detrás de una máscara
 *  data-fx-delay="0.2" → retraso opcional en segundos
 */
export function usePageFx(rootRef: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = prefersReducedMotion();

    const ctx = gsap.context(() => {
      /* Títulos con máscara */
      root.querySelectorAll<HTMLElement>('[data-fx-mask]').forEach((el) => {
        const words = el.querySelectorAll<HTMLElement>('.mh-word');
        if (words.length === 0) return;
        if (reduced) {
          gsap.set(words, { yPercent: 0 });
          return;
        }
        gsap.fromTo(
          words,
          { yPercent: 115 },
          {
            yPercent: 0,
            duration: 0.9,
            ease: 'power4.out',
            stagger: 0.05,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          },
        );
      });

      /* Elementos individuales */
      root.querySelectorAll<HTMLElement>('[data-fx="rise"]').forEach((el) => {
        const delay = Number(el.dataset.fxDelay ?? 0);
        if (reduced) {
          gsap.set(el, { autoAlpha: 1, y: 0 });
          return;
        }
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            delay,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          },
        );
      });

      /* Líneas y divisores que se dibujan */
      root.querySelectorAll<HTMLElement>('[data-fx="draw"]').forEach((el) => {
        if (reduced) {
          gsap.set(el, { scaleX: 1 });
          return;
        }
        gsap.fromTo(
          el,
          { scaleX: 0, transformOrigin: 'left center' },
          {
            scaleX: 1,
            duration: 1.1,
            ease: 'power3.inOut',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          },
        );
      });

      /* Grupos escalonados */
      root.querySelectorAll<HTMLElement>('[data-fx-group]').forEach((group) => {
        const items = Array.from(group.children) as HTMLElement[];
        if (items.length === 0) return;
        if (reduced) {
          gsap.set(items, { autoAlpha: 1, y: 0 });
          return;
        }
        gsap.fromTo(
          items,
          { autoAlpha: 0, y: 34, scale: 0.985 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.09,
            scrollTrigger: { trigger: group, start: 'top 86%', once: true },
          },
        );
      });
    }, root);

    // El layout de la página pudo cambiar tras montar (fuentes, imágenes).
    const refresh = () => ScrollTrigger.refresh();
    const t = window.setTimeout(refresh, 120);

    return () => {
      window.clearTimeout(t);
      ctx.revert();
    };
  }, [rootRef]);
}

/**
 * Efecto imán (capa 4): el elemento sigue levemente el cursor y regresa
 * con un resorte al salir. Solo escritorio con puntero fino.
 */
export function useMagnetic(
  ref: RefObject<HTMLElement | null>,
  strength = 0.32,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * strength);
      yTo(dy * strength * 0.85);
    };

    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [ref, strength]);
}

export { gsap, ScrollTrigger };
