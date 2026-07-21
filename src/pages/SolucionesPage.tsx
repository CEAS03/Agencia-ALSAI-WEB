import { useEffect, useRef, useState } from 'react';
import { usePageFx } from '../lib/motion';
import { prefersReducedMotion } from '../lib/useReveal';
import { Eyebrow, MaskHeading } from '../components/ui/primitives';
import { DiagCta } from '../components/ui/buttons';

/**
 * SOLUCIONES (/soluciones) — las seis piezas del sistema, a fondo.
 * Navegador lateral sticky con scrollspy; cada módulo lista qué incluye,
 * qué resuelve y con qué otras piezas se conecta (chips navegables).
 */

interface Mod {
  id: string;
  title: string;
  icon: string;
  solves: string;
  includes: string[];
  connects: string[];
}

const MODS: Mod[] = [
  {
    id: 'captacion',
    title: 'Captación y demanda',
    icon: 'M4.6 13.6v-3.2L16 6v12L4.6 13.6ZM7.8 14.4v2.6c0 .85.6 1.55 1.45 1.7l1.55.25M18.6 9.4a4.3 4.3 0 0 1 0 5.2',
    solves:
      'Que llegue la persona correcta, no solo tráfico. Cada campaña se conecta al resto del sistema, así sabes qué inversión termina en clientes y no solo en clics.',
    includes: [
      'Campañas de Meta y Google Ads',
      'Contenido y presencia orgánica',
      'SEO local y de sitio',
      'Landings y funnels de conversión',
      'Segmentación por servicio y zona',
      'Atribución conectada al CRM',
    ],
    connects: ['atencion', 'web', 'datos'],
  },
  {
    id: 'atencion',
    title: 'Atención inteligente',
    icon: 'M12 4.6l1.75 5.65L19.4 12l-5.65 1.75L12 19.4l-1.75-5.65L4.6 12l5.65-1.75L12 4.6Z',
    solves:
      'Que nadie espere. El agente de IA responde al instante en WhatsApp y web, califica la oportunidad y entrega el contexto completo a tu equipo cuando toca lo humano.',
    includes: [
      'Agente de IA en WhatsApp',
      'Agente en tu sitio web',
      'Respuesta inmediata 24/7',
      'Calificación de oportunidades',
      'Recopilación de datos útiles',
      'Transferencia a humano con contexto',
    ],
    connects: ['crm', 'agenda'],
  },
  {
    id: 'crm',
    title: 'CRM y proceso comercial',
    icon: 'M12 4.4 19.6 8.6 12 12.8 4.4 8.6 12 4.4ZM4.4 12.6l7.6 4.2 7.6-4.2M4.4 16.4l7.6 4.2 7.6-4.2',
    solves:
      'Que ninguna oportunidad viva en la memoria de alguien. Cada contacto tiene etapa, historial, responsable y próxima acción: visibilidad total de tu pipeline.',
    includes: [
      'Base de contactos centralizada',
      'Pipeline por etapas a tu medida',
      'Historial de conversaciones',
      'Tareas y alertas para tu equipo',
      'Etiquetado por origen y servicio',
      'Registros sin capturas manuales',
    ],
    connects: ['agenda', 'datos'],
  },
  {
    id: 'agenda',
    title: 'Agenda, seguimiento y recuperación',
    icon: 'M5 7.2h14a1.4 1.4 0 0 1 1.4 1.4v9.6a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6V8.6A1.4 1.4 0 0 1 5 7.2ZM3.6 11h16.8M8.3 4.4v3M15.7 4.4v3',
    solves:
      'Que lo agendado suceda y lo pendiente no muera. Confirmaciones, recordatorios y recuperación trabajan solos; tu equipo solo interviene donde aporta.',
    includes: [
      'Agendado conectado a disponibilidad real',
      'Confirmaciones y recordatorios automáticos',
      'Recuperación de presupuestos pendientes',
      'Reactivación de clientes inactivos',
      'Solicitud de reseñas en el momento justo',
      'Rutas de seguimiento por tipo de contacto',
    ],
    connects: ['crm', 'datos'],
  },
  {
    id: 'web',
    title: 'Experiencias web que convierten',
    icon: 'M4 6.4h16a1 1 0 0 1 1 1v9.2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7.4a1 1 0 0 1 1-1ZM3 9.6h18M6 8h.01M8.4 8h.01',
    solves:
      'Que tu presencia digital venda sola. Sitios y landings premium — como este — con formularios inteligentes y demos interactivas conectadas al sistema completo.',
    includes: [
      'Sitios web premium a la medida',
      'Landings de campaña de alta conversión',
      'Formularios inteligentes',
      'Demos y diagnósticos interactivos',
      'Velocidad y animación sin sacrificar FPS',
      'Integración directa con CRM y WhatsApp',
    ],
    connects: ['captacion', 'atencion'],
  },
  {
    id: 'datos',
    title: 'Automatización, datos y optimización',
    icon: 'M13.2 3.8 5.6 13.6h5.2l-1 6.6 7.6-9.8h-5.2l1-6.6Z',
    solves:
      'Que el sistema mejore cada mes. Las tareas repetitivas se automatizan, los datos se vuelven tableros claros y las decisiones dejan de ser corazonadas.',
    includes: [
      'Integraciones entre tus herramientas',
      'Automatización de tareas administrativas',
      'Dashboards de operación y marketing',
      'Alertas de fugas y cuellos de botella',
      'Reportes claros, sin tecnicismos',
      'Optimización continua con datos reales',
    ],
    connects: ['captacion', 'crm'],
  },
];

const NAME_BY_ID = Object.fromEntries(MODS.map((m) => [m.id, m.title]));

export default function SolucionesPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  usePageFx(rootRef);
  const [current, setCurrent] = useState(MODS[0].id);

  /* Scrollspy: el navegador lateral sigue el módulo visible. */
  useEffect(() => {
    const sections = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>('.sol-mod') ?? [],
    );
    if (sections.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setCurrent(e.target.id);
        }
      },
      { rootMargin: '-38% 0px -52% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <div ref={rootRef}>
      {/* ── Hero ── */}
      <section className="cl-hero site-sec" aria-labelledby="sol-title">
        <div className="site-shell">
          <Eyebrow>Soluciones</Eyebrow>
          <MaskHeading
            as="h1"
            id="sol-title"
            className="h-display"
            text="Seis piezas que trabajan **como una sola.**"
          />
          <p className="t-lead" data-fx="rise">
            Ninguna se vende suelta porque ninguna funciona sola: se contratan y configuran según
            tu diagnóstico, siempre conectadas. Esto es lo que hay dentro de cada una.
          </p>
        </div>
      </section>

      {/* ── Módulos con navegador lateral ── */}
      <section className="site-sec" aria-label="Detalle de los seis módulos">
        <div className="site-shell">
          <div className="sol-layout">
            <nav className="sol-nav" aria-label="Navegación de módulos" data-fx="rise">
              {MODS.map((m, i) => (
                <button
                  key={m.id}
                  className={current === m.id ? 'is-current' : ''}
                  onClick={() => jump(m.id)}
                >
                  <span className="sn-num">0{i + 1}</span>
                  {m.title}
                </button>
              ))}
            </nav>

            <div>
              {MODS.map((m, i) => (
                <article
                  className="sol-mod"
                  id={m.id}
                  key={m.id}
                  style={{ scrollMarginTop: 'calc(var(--nav-h) + 20px)' }}
                >
                  <div className="sol-mod-head" data-fx="rise">
                    <span className="sol-mod-num">Módulo 0{i + 1}</span>
                    <span className="sol-mod-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                        <path d={m.icon} />
                      </svg>
                    </span>
                    <h2>{m.title}</h2>
                  </div>

                  <p className="sol-solves" data-fx="rise">
                    {m.solves}
                  </p>

                  <ul className="sol-list" data-fx-group>
                    {m.includes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  <div className="sol-connects" data-fx="rise">
                    <span className="microlabel">Alimenta a</span>
                    {m.connects.map((c) => (
                      <button className="chip" key={c} onClick={() => jump(c)}>
                        {NAME_BY_ID[c]}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Cierre ── */}
      <section className="site-sec cierre" aria-labelledby="solc-title">
        <span className="cierre-glow" aria-hidden="true" />
        <div className="site-shell cierre-inner">
          <Eyebrow>El orden lo define tu operación</Eyebrow>
          <MaskHeading
            id="solc-title"
            className="h-sec"
            text="¿Qué piezas necesita **tu negocio primero?**"
            style={{ marginTop: 18 }}
          />
          <p className="t-lead" data-fx="rise">
            El diagnóstico detecta tus fugas más caras y propone el orden de implementación con
            mayor impacto. Sin plantillas cerradas y sin comprar nada que no necesites.
          </p>
          <DiagCta />
          <p className="cierre-hint" data-fx="rise">
            Unos minutos. Sin costo. El siguiente paso se conversa por WhatsApp.
          </p>
        </div>
      </section>
    </div>
  );
}
