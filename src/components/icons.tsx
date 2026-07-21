import type { SVGProps } from 'react';

/** Iconos de interfaz — trazo propio, 24 viewBox, sin dependencias. */

function base(props: SVGProps<SVGSVGElement>) {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
}

export const IconPulse = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3.5 12h4l2.2-5.5 4 11L16 12h4.5" />
  </svg>
);

export const IconContact = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3.2" y="4.8" width="17.6" height="14.4" rx="2.6" />
    <circle cx="9" cy="11" r="2.1" />
    <path d="M5.8 16.6c.6-1.9 1.8-2.8 3.2-2.8s2.6.9 3.2 2.8M15.4 9.6h3.4M15.4 13.2h3.4" />
  </svg>
);

export const IconPin = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 21s-6.5-5.4-6.5-10.3a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21Z" />
    <circle cx="12" cy="10.4" r="2.2" />
  </svg>
);

export const IconGlobe = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M3.6 12h16.8M12 3.6c2.3 2.3 3.4 5.2 3.4 8.4s-1.1 6.1-3.4 8.4c-2.3-2.3-3.4-5.2-3.4-8.4s1.1-6.1 3.4-8.4Z" />
  </svg>
);

export const IconInstagram = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.4" />
    <circle cx="12" cy="12" r="3.9" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

export const IconLinkedIn = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="3" />
    <path d="M8 10.4v6M8 7.6v.1M12 16.4v-3.5c0-1.4.9-2.4 2.2-2.4s2.2 1 2.2 2.4v3.5" />
  </svg>
);

export const IconWhatsApp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 4.5a7.5 7.5 0 0 0-6.42 11.38L4.6 19.4l3.62-.94A7.5 7.5 0 1 0 12 4.5Z" />
    <path d="M9.6 8.9l.95 1.85-.95 1.05a6.2 6.2 0 0 0 2.6 2.6l1.05-.95 1.85.95c-.35 1.2-1.45 1.85-2.65 1.5a7.1 7.1 0 0 1-4.35-4.35c-.35-1.2.3-2.3 1.5-2.65Z" />
  </svg>
);

export const IconShield = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3.6 19 6.2v5.2c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6.2L12 3.6Z" />
    <path d="M9.2 11.8l2 2 3.6-3.8" />
  </svg>
);

export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
);

export const IconSend = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4.5 12 19.5 4.8l-3.2 14.4-4.6-4.4-4.4 2.4 1.2-4.8 8.6-7" />
  </svg>
);

export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const IconArrowDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 4.5v15M6 13.5l6 6 6-6" />
  </svg>
);

export const IconCalendar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3.8" y="5.8" width="16.4" height="14.2" rx="2.4" />
    <path d="M3.8 10.2h16.4M8.4 3.4v3M15.6 3.4v3M12 14h4.2" />
  </svg>
);
