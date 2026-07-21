import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '../../lib/useReveal';

/**
 * Halo de cursor (capa 4): un anillo con retardo elástico sigue el puntero
 * y reacciona sobre elementos interactivos. No sustituye al cursor nativo
 * (usabilidad primero) y no existe en pantallas táctiles.
 */
export function CursorHalo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.38, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.38, ease: 'power3.out' });
    let visible = false;
    let hot = false;

    const onMove = (e: PointerEvent) => {
      if (!visible) {
        visible = true;
        el.classList.add('is-on');
      }
      xTo(e.clientX);
      yTo(e.clientY);

      const target = e.target as HTMLElement | null;
      const nextHot = Boolean(target?.closest('a, button, [data-cursor], input, textarea, [role="button"]'));
      if (nextHot !== hot) {
        hot = nextHot;
        el.classList.toggle('is-hot', hot);
        gsap.to(el, { scale: hot ? 1.5 : 1, duration: 0.28, ease: 'power3.out' });
      }
    };

    const onLeave = () => {
      visible = false;
      el.classList.remove('is-on');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <div ref={ref} className="cursor-halo" aria-hidden="true" />;
}
