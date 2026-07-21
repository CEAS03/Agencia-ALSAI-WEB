import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../../lib/motion';
import { prefersReducedMotion } from '../../lib/useReveal';
import { introPending } from '../../components/layout/PageTransition';
import { MaskHeading } from '../../components/ui/primitives';
import { DiagCta, SecondaryCta } from '../../components/ui/buttons';
import { IconArrowDown } from '../../components/icons';

/**
 * SECCIÓN 1 — Hero de la Home.
 * Momento firma: el ecosistema WebGL "se conecta" al cargar (revealEco en
 * el Layout) mientras el título entra por máscara y los CTAs se encadenan.
 * La coreografía es propia (no usa data-fx) para sincronizarse con la
 * intro de marca cuando es el primer ingreso de la sesión.
 */
export function HeroHome() {
  const rootRef = useRef<HTMLElement>(null);
  /* Capturado antes de que el Layout marque la intro como mostrada. */
  const hadIntro = useRef(introPending());

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = gsap.utils.selector(root);

    if (prefersReducedMotion()) {
      gsap.set(q('.hh-stagger, .mh-word'), { autoAlpha: 1, y: 0, yPercent: 0 });
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power4.out' },
      delay: hadIntro.current ? 1.0 : 0.2,
    });

    tl.fromTo(q('.hh-eyebrow'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.65 }, 0)
      .fromTo(
        q('.mh-word'),
        { yPercent: 115 },
        { yPercent: 0, duration: 1.05, stagger: 0.05 },
        0.12,
      )
      .fromTo(q('.hh-copy'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.6)
      .fromTo(q('.hh-audience'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.78)
      .fromTo(
        q('.hh-actions > *'),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12 },
        0.9,
      )
      .fromTo(q('.hh-cue'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7 }, 1.35);

    return () => {
      tl.kill();
    };
  }, []);

  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <section ref={rootRef} className="hh site-sec" aria-labelledby="hh-title">
      <div className="site-shell">
        <p className="eyebrow hh-eyebrow hh-stagger">Agencia de IA · Marketing · Automatización</p>

        <MaskHeading
          as="h1"
          id="hh-title"
          className="h-display hh-headline"
          auto={false}
          text="**Más clientes,** menos caos. Un sistema que hace el trabajo pesado por ti."
        />

        <p className="t-lead hh-copy hh-stagger">
          Conectamos captación, IA, WhatsApp, CRM y seguimiento en un solo sistema, para que
          ninguna oportunidad se pierda entre herramientas desconectadas.
        </p>

        <p className="hh-audience hh-stagger">Especializados en clínicas y negocios de servicios.</p>

        <div className="hh-actions">
          <DiagCta fx={false} />
          <SecondaryCta onPress={scrollToDemo} fx={false}>
            Ver el sistema en acción
          </SecondaryCta>
        </div>

        <div className="hh-cue hh-stagger" aria-hidden="true">
          <span className="cue-line" />
          <span className="microlabel">Desliza</span>
          <IconArrowDown width={13} height={13} />
        </div>
      </div>
    </section>
  );
}
