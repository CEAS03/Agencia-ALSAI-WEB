/**
 * ─────────────────────────────────────────────────────────────────────────
 *  CONFIGURACIÓN CENTRAL DE LA TARJETA DIGITAL ALSAI
 *  Todo lo editable vive aquí: identidad, contacto, enlaces e integraciones.
 *  Ningún componente contiene datos duros; edita este archivo y despliega.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface SiteLinks {
  /** Página oficial de ALSAI. Vacío = botón visible con aviso "muy pronto". */
  website: string;
  instagram: string;
  linkedin: string;
  /** Enlace wa.me completo, p. ej. "https://wa.me/52..." */
  whatsapp: string;
  /** URL del aviso de privacidad. */
  privacy: string;
}

export const site = {
  brand: {
    name: 'Agencia ALSAI',
    wordmark: 'ALSAI',
    /** Ruta a un logo SVG/PNG. null = se usa el wordmark tipográfico. */
    logoSrc: null as string | null,
    /** Línea sobre el wordmark; junto a `wordmark` forma el nombre completo (p. ej. "Agencia" + "ALSAI"). */
    overline: 'Agencia',
    /** Línea superior de la tarjeta. */
    marketLine: 'Clínicas en Querétaro.',
    /** Encabezado. `\n` fuerza salto de línea; **palabra** resalta. */
    headline: '**Más** citas.\n**Mejor** seguimiento.\n**Menos** carga operativa.',
    valueProp:
      'Transformamos tu clínica en un sistema inteligente que atrae, atiende y da seguimiento a cada paciente con marketing, IA, WhatsApp y CRM.',
    /** Texto del CTA principal (abre el diagnóstico). */
    ctaPrimary: 'Diseñar mi sistema de crecimiento',
    /** Nota bajo el CTA principal. */
    ctaNote: 'Análisis en 3 min. Sin costo.',
  },

  founder: {
    name: 'Carlos Álvarez',
    role: 'Fundador de Agencia ALSAI',
    location: 'Querétaro, Qro.',
    /** Ruta a la fotografía (colócala en /public, p. ej. "/carlos.jpg"). null = monograma elegante. */
    photoSrc: null as string | null,
    /** Datos de contacto para la vCard. Vacíos = el botón avisa "muy pronto" sin inventar datos. */
    phone: '',
    email: '',
  },

  links: {
    website: '',
    instagram: '',
    linkedin: '',
    whatsapp: '',
    privacy: '/aviso-de-privacidad',
  } satisfies SiteLinks as SiteLinks,

  integrations: {
    /** Webhook de n8n para el diagnóstico. Vacío = modo demo con guion local. */
    n8nWebhookUrl: (import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined) ?? '',
    hubspot: {
      portalId: (import.meta.env.VITE_HUBSPOT_PORTAL_ID as string | undefined) ?? '',
    },
    analyticsDebug:
      (import.meta.env.VITE_ANALYTICS_DEBUG as string | undefined) === 'true' ||
      import.meta.env.DEV,
  },
} as const;

export type Site = typeof site;
