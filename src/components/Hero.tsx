import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { site } from '../config/site';
import { track } from '../lib/analytics';
import { toast } from '../lib/toast';
import { saveFounderContact } from '../lib/vcard';
import { revealEco } from '../scene/ecosystem';
import { prefersReducedMotion } from '../lib/useReveal';
import { IconArrowDown, IconContact, IconPulse } from './icons';

interface HeroProps {
  onOpenDiagnostic: (originRect: DOMRect) => void;
}

/** Renderiza el encabezado: `\n` = nueva línea, **palabra** = resaltado. */
function renderHeadline(text: string) {
  return text.split('\n').map((line, li) => (
    <span className="hl-line" key={li}>
      {line
        .split(/(\*\*[^*]+\*\*)/g)
        .filter(Boolean)
        .map((seg, si) => {
          const m = seg.match(/^\*\*([^*]+)\*\*$/);
          return m ? (
            <span className="hl" key={si}>
              {m[1]}
            </span>
          ) : (
            <span key={si}>{seg}</span>
          );
        })}
    </span>
  ));
}

export function Hero({ onOpenDiagnostic }: HeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    revealEco();

    const q = gsap.utils.selector(root);

    if (prefersReducedMotion()) {
      gsap.set(q('.hero-top, .hero-eyebrow, .wm-letter, .wm-caret, .hero-headline, .hero-copy, .hero-actions > *, .hero-hint, .scroll-cue'), {
        opacity: 1,
      });
      ctaRef.current?.classList.add('is-live');
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.fromTo(q('.hero-top'), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.7 }, 0.1)
      .fromTo(q('.hero-eyebrow'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.18)
      .fromTo(
        q('.wm-letter'),
        { opacity: 0, y: 26, filter: 'blur(9px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, stagger: 0.05 },
        0.26,
      )
      .fromTo(q('.wm-caret'), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.72)
      .fromTo(q('.hero-headline'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, 0.52)
      .fromTo(q('.hero-copy'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7 }, 0.62)
      .fromTo(q('.cta-primary'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, 0.74)
      .add(() => ctaRef.current?.classList.add('is-live'), 1.55)
      .fromTo(q('.cta-secondary'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.55 }, 1.0)
      .fromTo(q('.hero-hint'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.15)
      .fromTo(q('.scroll-cue'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.35);

    return () => {
      tl.kill();
    };
  }, []);

  const handleDiagnostic = () => {
    const rect = ctaRef.current?.getBoundingClientRect();
    if (rect) onOpenDiagnostic(rect);
  };

  const handleSaveContact = () => {
    track('contact_save_clicked');
    if (!saveFounderContact()) {
      toast('El contacto directo estará disponible muy pronto');
    }
  };

  const wordmark = site.brand.wordmark;
  const plain = wordmark.slice(0, -2);
  const accent = wordmark.slice(-2);

  return (
    <section ref={rootRef} className="hero shell">
      <header className="hero-top" style={{ opacity: 0 }}>
        <span className="hero-brand">
          <span className="signal-dot" aria-hidden="true" />
          <span className="microlabel">{site.brand.marketLine}</span>
        </span>
      </header>

      <div className="hero-main">
        <p className="hero-eyebrow microlabel" style={{ opacity: 0 }}>
          {site.brand.overline}
        </p>

        <h1 className="wordmark" aria-label={site.brand.wordmark}>
          {plain.split('').map((ch, i) => (
            <span key={i} className="wm-letter" style={{ opacity: 0 }} aria-hidden="true">
              {ch}
            </span>
          ))}
          {accent.split('').map((ch, i) => (
            <span key={`a${i}`} className="wm-letter wm-ai" style={{ opacity: 0 }} aria-hidden="true">
              {ch}
            </span>
          ))}
          <span className="wm-caret" style={{ opacity: 0 }} aria-hidden="true" />
        </h1>

        <h2 className="hero-headline" style={{ opacity: 0 }}>
          {renderHeadline(site.brand.headline)}
        </h2>
        <p className="hero-copy" style={{ opacity: 0 }}>
          {site.brand.valueProp}
        </p>

        <div className="hero-actions">
          <button
            ref={ctaRef}
            className="cta-primary"
            style={{ opacity: 0 }}
            onClick={handleDiagnostic}
          >
            <span className="cta-ring" aria-hidden="true" />
            <span className="cta-glow" aria-hidden="true" />
            <IconPulse className="cta-icon" />
            <span className="cta-label">{site.brand.ctaPrimary}</span>
          </button>

          <p className="hero-hint" style={{ opacity: 0 }}>
            {site.brand.ctaNote}
          </p>

          <button className="cta-secondary" style={{ opacity: 0 }} onClick={handleSaveContact}>
            <IconContact />
            Guardar contacto de Carlos
          </button>
        </div>
      </div>

      <div className="scroll-cue" style={{ opacity: 0 }} aria-hidden="true">
        <span className="cue-line" />
        <span className="microlabel">Desliza</span>
        <IconArrowDown width={13} height={13} />
      </div>
    </section>
  );
}
