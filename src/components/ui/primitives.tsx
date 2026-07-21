import type { CSSProperties, ReactNode } from 'react';

/**
 * Primitivas del sitio: Section, Eyebrow, MaskHeading y ArrowLink.
 * Todas heredan tokens de la tarjeta; el movimiento lo aporta usePageFx
 * a través de los atributos data-fx.
 */

interface SectionProps {
  id?: string;
  className?: string;
  first?: boolean;
  children: ReactNode;
  ariaLabelledBy?: string;
}

export function Section({ id, className = '', first = false, children, ariaLabelledBy }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`site-sec${first ? ' site-sec--first' : ''} ${className}`.trim()}
    >
      <div className="site-shell">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, delay }: { children: ReactNode; delay?: number }) {
  return (
    <p className="eyebrow" data-fx="rise" data-fx-delay={delay}>
      {children}
    </p>
  );
}

/* ── Título con revelado por máscara ────────────────────────────────── */

type HeadingTag = 'h1' | 'h2' | 'h3';

interface MaskHeadingProps {
  as?: HeadingTag;
  /** Texto plano; `**palabra**` resalta con gradiente. */
  text: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
  /**
   * true (defecto): usePageFx anima la máscara al entrar en viewport.
   * false: el padre orquesta su propia timeline sobre .mh-word.
   */
  auto?: boolean;
}

interface WordToken {
  word: string;
  hl: boolean;
}

/** Divide en palabras conservando los tramos `**resaltados**`. */
function tokenize(text: string): WordToken[] {
  const tokens: WordToken[] = [];
  for (const seg of text.split(/(\*\*[^*]+\*\*)/g)) {
    if (!seg) continue;
    const m = seg.match(/^\*\*([^*]+)\*\*$/);
    const hl = Boolean(m);
    for (const word of (m ? m[1] : seg).split(/\s+/)) {
      if (word) tokens.push({ word, hl });
    }
  }
  return tokens;
}

export function MaskHeading({ as = 'h2', text, className = '', id, style, auto = true }: MaskHeadingProps) {
  const Tag = as;
  const tokens = tokenize(text);
  return (
    <Tag
      id={id}
      className={className}
      style={style}
      data-fx-mask={auto ? '' : undefined}
      aria-label={text.replace(/\*\*/g, '')}
    >
      {tokens.map((t, i) => (
        <span key={i} aria-hidden="true">
          <span className="mh-clip">
            <span className={`mh-word${t.hl ? ' t-hl' : ''}`}>{t.word}</span>
          </span>
          {i < tokens.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}

/* ── Enlace con flecha ──────────────────────────────────────────────── */

export function IconArrowRight(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={props.className}
    >
      <path d="M4.5 12h14M13 5.5l6.5 6.5L13 18.5" />
    </svg>
  );
}

export function ArrowLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="btn-arrow" onClick={onClick}>
      {children}
      <IconArrowRight />
    </button>
  );
}
