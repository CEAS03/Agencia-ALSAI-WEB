import { useContext, useRef, createContext, type ReactNode } from 'react';
import { useMagnetic } from '../../lib/motion';
import { track } from '../../lib/analytics';
import { IconPulse } from '../icons';

/**
 * Botones del sitio. Reutilizan las clases .cta-primary / .cta-secondary
 * de la tarjeta (anillo orbital, halo, press) y suman el efecto imán.
 */

/* ── Contexto del diagnóstico ───────────────────────────────────────── */

export interface DiagnosticApi {
  /** Abre el overlay del diagnóstico; rect = origen del morph. */
  open: (rect: DOMRect | null) => void;
}

export const DiagnosticContext = createContext<DiagnosticApi>({ open: () => {} });

export function useOpenDiagnostic(): DiagnosticApi['open'] {
  return useContext(DiagnosticContext).open;
}

/* ── CTA primario ───────────────────────────────────────────────────── */

interface PrimaryCtaProps {
  children: ReactNode;
  onPress: (rect: DOMRect | null) => void;
  fx?: boolean;
}

export function PrimaryCta({ children, onPress, fx = true }: PrimaryCtaProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useMagnetic(ref, 0.22);

  return (
    <button
      ref={ref}
      className="cta-primary cta-fit is-live"
      data-fx={fx ? 'rise' : undefined}
      data-cursor="hot"
      onClick={() => onPress(ref.current?.getBoundingClientRect() ?? null)}
    >
      <span className="cta-ring" aria-hidden="true" />
      <span className="cta-glow" aria-hidden="true" />
      <IconPulse className="cta-icon" />
      <span className="cta-label">{children}</span>
    </button>
  );
}

/**
 * CTA que abre el diagnóstico desde cualquier página.
 * Es el punto único donde se mide `primary_cta_click`: la conversión
 * principal del sitio y la que reciben los anuncios. `origen` permite
 * distinguir qué sección la generó sin duplicar el evento.
 */
export function DiagCta({
  children = 'Iniciar diagnóstico',
  fx,
  origen,
}: {
  children?: ReactNode;
  fx?: boolean;
  origen?: string;
}) {
  const open = useOpenDiagnostic();

  const onPress = (rect: DOMRect | null) => {
    track('primary_cta_click', { origen });
    open(rect);
  };

  return (
    <PrimaryCta onPress={onPress} fx={fx}>
      {children}
    </PrimaryCta>
  );
}

/* ── CTA secundario ─────────────────────────────────────────────────── */

interface SecondaryCtaProps {
  children: ReactNode;
  onPress: () => void;
  icon?: ReactNode;
  fx?: boolean;
}

export function SecondaryCta({ children, onPress, icon, fx = true }: SecondaryCtaProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useMagnetic(ref, 0.16);

  return (
    <button
      ref={ref}
      className="cta-secondary cta-fit"
      data-fx={fx ? 'rise' : undefined}
      data-cursor="hot"
      onClick={onPress}
    >
      {icon}
      {children}
    </button>
  );
}
