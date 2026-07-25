/**
 * Preguntas frecuentes del home — fuente única.
 *
 * La consumen dos capas que NO pueden divergir:
 *   • `pages/home/FaqCierre.tsx`  → el acordeón visible.
 *   • `seo/seo.config.ts`         → el schema FAQPage.
 *
 * Google exige que el structured data refleje contenido visible en la
 * página; si el schema y el acordeón se editaran por separado, el primer
 * cambio en uno invalidaría el otro (y puede costar una penalización
 * manual). Por eso el texto vive aquí y no duplicado en cada sitio.
 *
 * Sin dependencias de React: `scripts/gen-seo-files` y el prerender
 * importan esta cadena desde Node.
 */

export interface FaqEntry {
  q: string;
  a: string;
}

export const FAQS: FaqEntry[] = [
  {
    q: '¿ALSAI trabaja únicamente con clínicas?',
    a: 'No. Nos especializamos en clínicas porque conocemos su operación a fondo, pero el mismo sistema funciona para inmobiliarias, comercios y negocios de servicios profesionales. El diagnóstico se adapta a cada operación.',
  },
  {
    q: '¿Necesito cambiar las herramientas que ya uso?',
    a: 'No necesariamente. Primero evaluamos lo que ya tienes: si una herramienta funciona, la conectamos al sistema en lugar de reemplazarla. Solo proponemos cambios cuando hay una razón operativa clara.',
  },
  {
    q: '¿La inteligencia artificial reemplaza a mi equipo?',
    a: 'No. La IA atiende lo repetitivo — responder al instante, recopilar datos, agendar, recordar — y tu equipo conserva las decisiones y el trato humano. Cada flujo define en qué punto interviene una persona.',
  },
  {
    q: '¿Pueden conectar WhatsApp, CRM y agenda?',
    a: 'Sí; esa conexión es el núcleo del sistema. La conversación, el registro del contacto y la cita dejan de vivir en lugares separados: cada mensaje actualiza el CRM y la agenda sin capturas manuales.',
  },
  {
    q: '¿Cuánto tarda una implementación?',
    a: 'Depende de los módulos que tu diagnóstico priorice. Trabajamos por fases para que tu operación nunca se detenga, y el plan con tiempos concretos se define contigo antes de comenzar.',
  },
  {
    q: '¿Qué pasa después de implementar?',
    a: 'El sistema se mide y se optimiza de forma continua: revisamos datos reales, detectamos fugas nuevas y ajustamos flujos. La implementación es el inicio, no el final del trabajo.',
  },
  {
    q: '¿Cómo se protege la información de mi negocio y mis clientes?',
    a: 'La información de tu negocio y de tus clientes sigue siendo tuya. Usamos accesos controlados, cada integración se limita a los datos que necesita y el tratamiento se describe en nuestro aviso de privacidad. No vendemos ni compartimos datos con terceros.',
  },
  {
    q: '¿Qué recibo al terminar el diagnóstico?',
    a: 'Un mapa claro de tus áreas prioritarias: dónde estás perdiendo oportunidades y qué conviene resolver primero. Después continuamos por WhatsApp y, si te interesa, agendamos una reunión estratégica para revisarlo juntos.',
  },
];
