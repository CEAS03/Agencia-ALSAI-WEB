/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SEO CENTRAL DEL SITIO
 *  Única fuente de verdad para title, description, canonical, Open Graph,
 *  Twitter Card y JSON-LD de cada ruta. La consumen tres capas:
 *    1. scripts/prerender.mjs  → inyecta el <head> en el HTML estático.
 *    2. src/seo/useSeo.ts      → sincroniza el <head> al navegar en cliente.
 *    3. scripts/gen-seo-files  → construye sitemap.xml y robots.txt.
 *
 *  REGLA: aquí solo va información verificable. Sin dirección exacta, sin
 *  reseñas, sin calificaciones, sin certificaciones ni perfiles sociales
 *  mientras no existan datos reales que respalden cada campo.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { site } from '../config/site';

export const SITE_URL = 'https://www.agencia-alsai.com';
export const SITE_NAME = 'Agencia ALSAI';
export const SITE_LOCALE = 'es_MX';
export const OG_IMAGE_PATH = '/og/agencia-alsai-og.png';
export const OG_IMAGE_ALT =
  'Agencia ALSAI — sistemas de crecimiento con inteligencia artificial y automatización en Querétaro';

/** Une el dominio canónico con una ruta interna, sin barra doble ni final. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const clean = `/${path}`.replace(/\/{2,}/g, '/');
  return clean === '/' ? `${SITE_URL}/` : `${SITE_URL}${clean.replace(/\/$/, '')}`;
}

export interface RouteSeo {
  /** Ruta sin barra final (la home es '/'). */
  path: string;
  title: string;
  description: string;
  /** Prioridad y frecuencia para sitemap.xml. */
  priority: number;
  changefreq: 'weekly' | 'monthly' | 'yearly';
  /** false = fuera del sitemap y con meta robots noindex. */
  index?: boolean;
  /** Migas para BreadcrumbList; la home no lleva. */
  breadcrumb?: { name: string; path: string }[];
  /** Nombre corto para el JSON-LD de WebPage. */
  shortName?: string;
}

/* ── Los seis módulos del sistema (schema Service en /soluciones) ────────── */

export const SERVICES = [
  {
    name: 'Captación y generación de demanda',
    description:
      'Campañas de Meta y Google Ads, SEO local, contenido y landings de conversión con atribución conectada al CRM.',
  },
  {
    name: 'Atención inteligente con IA y WhatsApp',
    description:
      'Agente de inteligencia artificial que responde 24/7 en WhatsApp y en el sitio web, califica la oportunidad y la transfiere a una persona con el contexto completo.',
  },
  {
    name: 'CRM y proceso comercial',
    description:
      'Base de contactos centralizada, pipeline por etapas, historial de conversaciones y tareas para el equipo, sin capturas manuales.',
  },
  {
    name: 'Agenda, seguimiento y recuperación de pacientes',
    description:
      'Agendado conectado a disponibilidad real, confirmaciones y recordatorios automáticos, y recuperación de presupuestos y pacientes pendientes.',
  },
  {
    name: 'Desarrollo web y páginas que convierten',
    description:
      'Sitios y landings premium a la medida, con formularios inteligentes y demos interactivas conectadas al sistema completo.',
  },
  {
    name: 'Automatización de procesos, datos y optimización',
    description:
      'Integraciones entre herramientas, automatización de tareas repetitivas y tableros de datos para decidir con información y no con corazonadas.',
  },
] as const;

/* ── Metadata por ruta ───────────────────────────────────────────────────── */

const HOME_DESC =
  'Agencia de inteligencia artificial y automatización en Querétaro. Conectamos marketing, IA, WhatsApp, CRM y seguimiento en un solo sistema de crecimiento. Diagnóstico gratuito en 3 minutos.';

export const ROUTES: RouteSeo[] = [
  {
    path: '/',
    shortName: 'Inicio',
    title: 'Agencia de Inteligencia Artificial en Querétaro | ALSAI',
    description: HOME_DESC,
    priority: 1.0,
    changefreq: 'weekly',
  },
  {
    path: '/clinicas',
    shortName: 'Clínicas',
    title: 'Inteligencia Artificial para Clínicas | Agencia ALSAI',
    description:
      'Automatiza citas, seguimiento y recuperación de pacientes con inteligencia artificial y WhatsApp. Sistema completo para clínicas dentales, estéticas y de salud en Querétaro.',
    priority: 0.9,
    changefreq: 'monthly',
    breadcrumb: [{ name: 'Clínicas', path: '/clinicas' }],
  },
  {
    path: '/soluciones',
    shortName: 'Soluciones',
    title: 'Automatización de Procesos, IA y CRM | Agencia ALSAI',
    description:
      'Seis piezas conectadas: captación, atención con IA en WhatsApp, CRM, agenda y seguimiento, web y automatización de procesos para empresas en Querétaro.',
    priority: 0.9,
    changefreq: 'monthly',
    breadcrumb: [{ name: 'Soluciones', path: '/soluciones' }],
  },
  {
    path: '/diagnostico',
    shortName: 'Diagnóstico',
    title: 'Diagnóstico Gratuito de Crecimiento | Agencia ALSAI',
    description:
      'Descubre en 3 minutos dónde tu clínica o negocio está perdiendo clientes. Diagnóstico gratuito con estimación de impacto económico. Sin costo y sin compromiso.',
    priority: 0.9,
    changefreq: 'monthly',
    breadcrumb: [{ name: 'Diagnóstico', path: '/diagnostico' }],
  },
  {
    path: '/casos',
    shortName: 'Casos',
    title: 'Casos Reales de Automatización con IA | Agencia ALSAI',
    description:
      'Sistemas de inteligencia artificial y automatización funcionando hoy: WhatsApp con IA, CRM y seguimiento automático. Casos reales de Agencia ALSAI en Querétaro.',
    priority: 0.8,
    changefreq: 'monthly',
    breadcrumb: [{ name: 'Casos', path: '/casos' }],
  },
  {
    path: '/casos/blindafon',
    shortName: 'Caso Blindafon',
    title: 'Caso Blindafon: WhatsApp con IA 24/7 | Agencia ALSAI',
    description:
      'Cómo Blindafon atiende, cotiza y da seguimiento con un agente de WhatsApp con inteligencia artificial. Caso operativo real de Agencia ALSAI que puedes probar.',
    priority: 0.7,
    changefreq: 'yearly',
    breadcrumb: [
      { name: 'Casos', path: '/casos' },
      { name: 'Blindafon', path: '/casos/blindafon' },
    ],
  },
  {
    path: '/casos/inmobiliaria',
    shortName: 'Caso inmobiliaria',
    title: 'Caso Inmobiliaria: Captación y CRM con IA | ALSAI',
    description:
      'Un ecosistema para captar, atender y distribuir oportunidades entre asesores con inteligencia artificial, WhatsApp y CRM. Caso real de automatización de Agencia ALSAI.',
    priority: 0.7,
    changefreq: 'yearly',
    breadcrumb: [
      { name: 'Casos', path: '/casos' },
      { name: 'Inmobiliaria', path: '/casos/inmobiliaria' },
    ],
  },
  {
    path: '/nosotros',
    shortName: 'Nosotros',
    title: 'Sobre ALSAI | Agencia de IA y Automatización',
    description:
      'Somos Agencia ALSAI: inteligencia artificial y automatización aplicadas a negocios reales en Querétaro. Conoce a Carlos Álvarez y el método detrás de cada sistema.',
    priority: 0.7,
    changefreq: 'yearly',
    breadcrumb: [{ name: 'Nosotros', path: '/nosotros' }],
  },
  {
    path: '/aviso-de-privacidad',
    shortName: 'Aviso de privacidad',
    title: 'Aviso de Privacidad | Agencia ALSAI',
    description:
      'Aviso de privacidad de Agencia ALSAI: qué datos recabamos a través del diagnóstico y los formularios del sitio, con qué finalidad los usamos y cómo ejercer tus derechos ARCO.',
    priority: 0.3,
    changefreq: 'yearly',
    breadcrumb: [{ name: 'Aviso de privacidad', path: '/aviso-de-privacidad' }],
  },
];

/** Ruta comodín: se prerenderiza como 404.html y nunca se indexa. */
export const NOT_FOUND_SEO: RouteSeo = {
  path: '/404',
  shortName: 'Página no encontrada',
  title: 'Página no encontrada | Agencia ALSAI',
  description: 'La página que buscas no existe o cambió de dirección.',
  priority: 0,
  changefreq: 'yearly',
  index: false,
};

export function getRouteSeo(pathname: string): RouteSeo {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
  return ROUTES.find((r) => r.path === clean) ?? NOT_FOUND_SEO;
}

/* ── JSON-LD ─────────────────────────────────────────────────────────────── */

/** Perfiles oficiales, para `sameAs`. Solo los que existen de verdad: un
 *  `sameAs` a un perfil vacío o ajeno le dice a Google que ese perfil te
 *  representa, y eso es peor que no declarar ninguno. */
const SOCIAL_PROFILES = [site.links.instagram, site.links.linkedin].filter(Boolean);

const ORG_ID = `${SITE_URL}/#organizacion`;
const WEBSITE_ID = `${SITE_URL}/#sitio`;
const FOUNDER_ID = `${SITE_URL}/nosotros#carlos-alvarez`;

/**
 * Organización + servicio profesional en un solo nodo.
 * Sin `address.streetAddress`, `sameAs`, `openingHours`, `aggregateRating` ni
 * `priceRange`: no hay dato público verificable para ninguno todavía. En cuanto
 * existan los perfiles de Instagram y LinkedIn entran como `sameAs`.
 */
function organizationNode() {
  return {
    '@type': ['Organization', 'ProfessionalService'],
    '@id': ORG_ID,
    name: SITE_NAME,
    alternateName: 'ALSAI',
    url: `${SITE_URL}/`,
    description:
      'Agencia de inteligencia artificial y automatización en Querétaro. Construye sistemas de crecimiento que conectan marketing, IA, WhatsApp, CRM, agenda y seguimiento para clínicas y negocios de servicios.',
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/favicon.svg'),
    },
    image: absoluteUrl(OG_IMAGE_PATH),
    founder: { '@id': FOUNDER_ID },
    /* Se emiten solo si hay dato en site.ts: un campo vacío en el JSON-LD es
       peor que su ausencia. */
    ...(site.founder.phone ? { telephone: site.founder.phone } : {}),
    ...(site.founder.email ? { email: site.founder.email } : {}),
    ...(site.founder.phone || site.founder.email
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            ...(site.founder.phone ? { telephone: site.founder.phone } : {}),
            ...(site.founder.email ? { email: site.founder.email } : {}),
            areaServed: 'MX',
            availableLanguage: 'es',
          },
        }
      : {}),
    /* ALSAI no tiene local físico: se declara la ciudad y el CP, nunca una
       calle. Junto con `areaServed` esto describe un negocio que atiende una
       zona, no un lugar al que se pueda ir. */
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Santiago de Querétaro',
      addressRegion: 'Querétaro',
      postalCode: '76060',
      addressCountry: 'MX',
    },
    /* Horario de atención, no de un mostrador: lunes a sábado, 08:00–20:00
       (confirmado por Carlos el 2026-07-23). */
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:00',
      closes: '20:00',
    },
    ...(SOCIAL_PROFILES.length ? { sameAs: SOCIAL_PROFILES } : {}),
    areaServed: [
      { '@type': 'City', name: 'Querétaro' },
      { '@type': 'Country', name: 'México' },
    ],
    knowsAbout: [
      'Inteligencia artificial aplicada a negocios',
      'Automatización de procesos empresariales',
      'WhatsApp con inteligencia artificial',
      'CRM y recuperación de pacientes',
      'Automatización de citas y seguimiento',
      'Marketing digital para clínicas',
    ],
    availableLanguage: { '@type': 'Language', name: 'Español', alternateName: 'es' },
  };
}

function founderNode() {
  return {
    '@type': 'Person',
    '@id': FOUNDER_ID,
    name: 'Carlos Álvarez',
    jobTitle: 'Fundador',
    worksFor: { '@id': ORG_ID },
    url: absoluteUrl('/nosotros'),
    ...(site.founder.photoSrc ? { image: absoluteUrl(site.founder.photoSrc) } : {}),
  };
}

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    inLanguage: 'es-MX',
    publisher: { '@id': ORG_ID },
  };
}

function webPageNode(route: RouteSeo) {
  const url = absoluteUrl(route.path);
  const node: Record<string, unknown> = {
    '@type': 'WebPage',
    '@id': `${url}#pagina`,
    url,
    name: route.title,
    description: route.description,
    inLanguage: 'es-MX',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: absoluteUrl(OG_IMAGE_PATH),
    },
  };

  if (route.breadcrumb?.length) {
    node.breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: `${SITE_URL}/`,
        },
        ...route.breadcrumb.map((crumb, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: crumb.name,
          item: absoluteUrl(crumb.path),
        })),
      ],
    };
  }

  return node;
}

/** Los seis servicios, solo en /soluciones (donde son contenido visible). */
function serviceNodes() {
  return SERVICES.map((service) => ({
    '@type': 'Service',
    name: service.name,
    description: service.description,
    serviceType: service.name,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'City', name: 'Querétaro' },
  }));
}

/**
 * Grafo JSON-LD de la ruta. Un único bloque `@graph` evita nodos duplicados
 * entre páginas y deja que Google resuelva las referencias por `@id`.
 */
export function buildJsonLd(route: RouteSeo): string {
  const graph: Record<string, unknown>[] = [
    organizationNode(),
    founderNode(),
    websiteNode(),
    webPageNode(route),
  ];

  if (route.path === '/soluciones') graph.push(...serviceNodes());

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}
