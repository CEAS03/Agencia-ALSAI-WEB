import { useEffect, useRef, useState } from 'react';
import { registerScene } from './ecosystem';
import { FallbackBackground } from './FallbackBackground';
import { prefersReducedMotion } from '../lib/useReveal';

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Monta el ecosistema WebGL a pantalla completa detrás del contenido.
 * El canvas no captura eventos: la interacción llega por listeners globales
 * para no bloquear nunca el scroll ni los botones.
 *
 * Dos decisiones que sostienen el SEO y el LCP:
 *  1. El primer render es siempre 'pending' (nada de canvas ni fallback), así
 *     el HTML prerenderizado y el primer render del cliente coinciden y la
 *     hidratación no encuentra diferencias.
 *  2. Three.js entra por import dinámico: son ~119 kB gzip que dejan de
 *     competir con el contenido por el ancho de banda inicial. El fondo es
 *     decorativo (aria-hidden), aparecer una fracción de segundo después no
 *     cambia la experiencia — `revealEco` ya lo hace entrar con fundido.
 */
export function EcosystemBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'pending' | 'webgl' | 'fallback'>('pending');

  useEffect(() => {
    setMode(webglAvailable() ? 'webgl' : 'fallback');
  }, []);

  useEffect(() => {
    if (mode !== 'webgl') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let teardown: (() => void) | null = null;

    void import('./EcosystemScene').then(({ EcosystemScene }) => {
      if (cancelled) return;

      const scene = new EcosystemScene(canvas, { reducedMotion: prefersReducedMotion() });
      registerScene(scene);

      const resize = () => scene.resize(window.innerWidth, window.innerHeight);
      resize();

      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scene.setScroll(max > 0 ? window.scrollY / max : 0);
      };
      onScroll();

      const toNdc = (clientX: number, clientY: number): [number, number] => [
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1,
      ];

      const onPointerMove = (e: PointerEvent) => {
        const [x, y] = toNdc(e.clientX, e.clientY);
        scene.setPointer(x, y);
      };

      let downAt = 0;
      let downPos: [number, number] = [0, 0];
      const onPointerDown = (e: PointerEvent) => {
        downAt = performance.now();
        downPos = [e.clientX, e.clientY];
      };
      const onPointerUp = (e: PointerEvent) => {
        // Solo cuenta como tap: breve, sin arrastre y fuera de controles.
        const dt = performance.now() - downAt;
        const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
        const target = e.target as HTMLElement;
        if (dt > 400 || moved > 12) return;
        if (target.closest('button, a, input, textarea, label, [role="dialog"]')) return;
        const [x, y] = toNdc(e.clientX, e.clientY);
        scene.pointerTap(x, y);
      };

      // Perspectiva sutil con el movimiento del teléfono (si el SO lo emite).
      const onTilt = (e: DeviceOrientationEvent) => {
        if (e.gamma == null || e.beta == null) return;
        scene.setTilt(e.gamma / 45, (e.beta - 40) / 60);
      };

      const onVisibility = () => scene.setRunning(!document.hidden);

      window.addEventListener('resize', resize);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { passive: true });
      window.addEventListener('deviceorientation', onTilt);
      document.addEventListener('visibilitychange', onVisibility);

      teardown = () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('deviceorientation', onTilt);
        document.removeEventListener('visibilitychange', onVisibility);
        registerScene(null);
        scene.dispose();
      };
    });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [mode]);

  if (mode === 'fallback') return <FallbackBackground />;

  return (
    <div className="eco-canvas" aria-hidden="true">
      {mode === 'webgl' ? <canvas ref={canvasRef} /> : null}
    </div>
  );
}
