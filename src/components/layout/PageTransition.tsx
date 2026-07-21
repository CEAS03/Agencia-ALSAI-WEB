import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '../../lib/useReveal';

/**
 * Transición de página (capa 3 del brief): un panel con el vértice de la
 * "A" de ALSAI barre la pantalla al cambiar de ruta (<0.5 s por barrido).
 * También ejecuta la intro de marca en el primer ingreso de la sesión.
 */

const INTRO_KEY = 'alsai-intro-v1';

/** true mientras la intro de esta sesión no se haya mostrado. */
export function introPending(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_KEY) === null;
  } catch {
    return false;
  }
}

function markIntroDone(): void {
  try {
    window.sessionStorage.setItem(INTRO_KEY, '1');
  } catch {
    /* almacenamiento bloqueado: la intro simplemente se repite */
  }
}

const TransitionContext = createContext<(to: string) => void>(() => {});

/** Navegación con barrido "A". Úsala en lugar de useNavigate. */
export function useTransitionNavigate(): (to: string) => void {
  return useContext(TransitionContext);
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const locRef = useRef(location.pathname);
  locRef.current = location.pathname;
  /* Capturado en el primer render: estable aunque StrictMode re-ejecute efectos. */
  const introNeeded = useRef(introPending() && !prefersReducedMotion());

  /* Intro de marca: solo primer ingreso, ~1 s, se omite con reduced motion. */
  useEffect(() => {
    const panel = panelRef.current;
    const mark = markRef.current;
    if (!panel || !mark || !introNeeded.current || document.hidden) return;
    markIntroDone();

    busyRef.current = true;
    document.documentElement.style.overflow = 'hidden';
    const tl = gsap.timeline({
      onComplete: () => {
        busyRef.current = false;
        document.documentElement.style.overflow = '';
        gsap.set(panel, { yPercent: 112 });
      },
    });
    tl.set(panel, { yPercent: 0 })
      .fromTo(
        mark,
        { opacity: 0, scale: 0.94, filter: 'blur(6px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.34, ease: 'power3.out' },
        0.08,
      )
      .to(mark, { opacity: 0, duration: 0.16, ease: 'power1.in' }, 0.68)
      .to(panel, { yPercent: -114, duration: 0.46, ease: 'power3.inOut' }, 0.72);

    return () => {
      /* StrictMode/desmontaje: nunca dejar el panel cubriendo ni el flag activo. */
      tl.kill();
      busyRef.current = false;
      document.documentElement.style.overflow = '';
      gsap.set(panel, { yPercent: 112 });
      gsap.set(mark, { opacity: 0 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = useCallback(
    (to: string) => {
      if (busyRef.current) return;
      if (to === locRef.current) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const panel = panelRef.current;
      const mark = markRef.current;
      /* Pestaña oculta: sin rAF no hay animación posible; navegar directo. */
      if (!panel || !mark || prefersReducedMotion() || document.hidden) {
        navigate(to);
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        return;
      }

      busyRef.current = true;
      const tl = gsap.timeline({
        onComplete: () => {
          busyRef.current = false;
          gsap.set(panel, { yPercent: 112 });
        },
      });
      tl.set(panel, { yPercent: 112 })
        .to(panel, { yPercent: 0, duration: 0.32, ease: 'power3.in' })
        .fromTo(
          mark,
          { opacity: 0, scale: 0.94 },
          { opacity: 0.9, scale: 1, duration: 0.2, ease: 'power2.out' },
          0.16,
        )
        .add(() => {
          navigate(to);
          window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        })
        .to(mark, { opacity: 0, duration: 0.12, ease: 'power1.in' }, '+=0.06')
        .to(panel, { yPercent: -114, duration: 0.42, ease: 'power3.inOut' }, '<');
    },
    [navigate],
  );

  /* Volver/adelante del navegador: sin barrido, pero arriba de la página. */
  useEffect(() => {
    const onPop = () => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <TransitionContext.Provider value={go}>
      {children}
      <div ref={panelRef} className="pt-panel" aria-hidden="true">
        <div ref={markRef} className="pt-mark">
          A<span className="pt-caret" />
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
