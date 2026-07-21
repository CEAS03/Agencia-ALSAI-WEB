import { useEffect, useRef } from 'react';
import { gsap, usePageFx } from '../lib/motion';
import { prefersReducedMotion } from '../lib/useReveal';
import { Eyebrow, MaskHeading } from '../components/ui/primitives';
import { DiagCta } from '../components/ui/buttons';
import { Accordion, type AccordionItem } from '../components/ui/Accordion';
import { SystemDemo } from '../components/demo/SystemDemo';
import { DEMO_CLINICA } from '../components/demo/demoScripts';
import { IconShield } from '../components/icons';

/**
 * CLÍNICAS (/clinicas) — página sectorial (sección 7.2 del brief).
 * Aquí el lenguaje es de pacientes, citas y tratamientos; se marca dónde
 * interviene la tecnología y dónde se conserva el control humano.
 */

const FUGAS = [
  { t: 'Consultas que tardan en responderse', b: 'El interés es máximo en los primeros minutos; cada hora de espera enfría la consulta.' },
  { t: 'Prospectos que preguntan pero no agendan', b: 'Piden precios o información y nadie retoma la conversación con un siguiente paso claro.' },
  { t: 'Citas sin confirmar o inasistencias', b: 'Espacios que se pierden porque nadie confirmó, recordó o recuperó la cita a tiempo.' },
  { t: 'Presupuestos y tratamientos sin seguimiento', b: 'La valoración se hizo, el plan se entregó… y quedó en el aire sin un responsable.' },
  { t: 'Pacientes inactivos que no se reactivan', b: 'Deberían regresar por revisión o mantenimiento, pero nadie detecta su ausencia.' },
  { t: 'Información dispersa', b: 'WhatsApp, agenda y expedientes viven separados; cada búsqueda cuesta minutos.' },
  { t: 'Marketing sin visibilidad hasta la cita', b: 'Se invierte en anuncios sin saber cuáles terminan en citas y tratamientos.' },
  { t: 'Personal administrativo saturado', b: 'Recepción responde, captura, confirma y persigue — todo a mano y al mismo tiempo.' },
];

type RecKind = 'tech' | 'human' | 'both';

const RECORRIDO: { name: string; note: string; kind: RecKind; chip: string }[] = [
  { name: 'Descubre la clínica', note: 'Campañas, contenido y presencia local llevan al paciente adecuado hasta ti.', kind: 'tech', chip: 'Sistema' },
  { name: 'Pregunta', note: 'El agente responde al instante por WhatsApp, a cualquier hora, con información aprobada por ti.', kind: 'tech', chip: 'IA' },
  { name: 'Recibe atención', note: 'Las dudas administrativas las resuelve la IA; lo clínico y lo delicado pasa a tu equipo con contexto.', kind: 'both', chip: 'IA + Equipo' },
  { name: 'Agenda', note: 'Se proponen espacios reales de tu agenda y la cita queda registrada sin capturas.', kind: 'tech', chip: 'Sistema' },
  { name: 'Confirma', note: 'Confirmaciones y recordatorios automáticos reducen inasistencias sin perseguir a nadie.', kind: 'tech', chip: 'Automático' },
  { name: 'Asiste', note: 'El trato en consulta es 100 % de tu equipo profesional. La tecnología no entra al consultorio.', kind: 'human', chip: 'Tu equipo' },
  { name: 'Recibe seguimiento', note: 'Presupuestos, tratamientos pendientes y post-consulta con seguimiento estructurado.', kind: 'both', chip: 'Automático + Humano' },
  { name: 'Regresa o recomienda', note: 'El sistema detecta cuándo toca volver y facilita la reseña; tu equipo decide el mensaje.', kind: 'both', chip: 'Sistema + Equipo' },
];

const SOLUCIONES = [
  { title: 'Captación de pacientes', body: 'Campañas y contenido pensados para tu especialidad: atraen al paciente correcto, no curiosos.', icon: 'M4.6 13.6v-3.2L16 6v12L4.6 13.6ZM7.8 14.4v2.6c0 .85.6 1.55 1.45 1.7l1.55.25M18.6 9.4a4.3 4.3 0 0 1 0 5.2' },
  { title: 'Atención y agendado por WhatsApp', body: 'El agente responde consultas, resuelve dudas de valoración y agenda citas conectado a tu disponibilidad real.', icon: 'M12 4.5a7.5 7.5 0 0 0-6.42 11.38L4.6 19.4l3.62-.94A7.5 7.5 0 1 0 12 4.5Z' },
  { title: 'Expediente comercial y CRM', body: 'Historial de cada paciente: origen, conversaciones, presupuestos, etapa y próxima acción, en un solo lugar.', icon: 'M12 4.4 19.6 8.6 12 12.8 4.4 8.6 12 4.4ZM4.4 12.6l7.6 4.2 7.6-4.2M4.4 16.4l7.6 4.2 7.6-4.2' },
  { title: 'Confirmaciones y recuperación', body: 'Recordatorios que reducen inasistencias, recuperación de presupuestos, reactivación de pacientes y reseñas.', icon: 'M18.6 8.8A7 7 0 0 0 6.2 7.6L4.8 9.6M4.6 5.6v4h4M5.4 15.2a7 7 0 0 0 12.4 1.2l1.4-2M19.4 18.4v-4h-4' },
];

const ESCENARIOS = [
  { title: 'Clínica dental', body: 'Valoraciones que se agendan solas, planes de ortodoncia con seguimiento y pacientes que regresan a sus ajustes.' },
  { title: 'Medicina estética', body: 'Consultas fuera de horario atendidas al momento, paquetes explicados con claridad y sesiones con recordatorio.' },
  { title: 'Salud general y especialidades', body: 'Agenda ordenada entre consultorios, confirmaciones automáticas y reactivación de pacientes de control.' },
];

const IMPL = [
  { t: 'Conectamos lo esencial', b: 'WhatsApp, agenda y registro de pacientes primero: la fuga más cara se cierra desde la primera fase.' },
  { t: 'Sumamos módulos por impacto', b: 'Campañas, seguimiento o recuperación entran después, según lo que tu diagnóstico priorice.' },
  { t: 'Tu equipo opera con acompañamiento', b: 'Capacitamos a recepción y coordinación; el sistema se ajusta a cómo trabaja tu clínica, no al revés.' },
];

const FAQS: AccordionItem[] = [
  {
    q: '¿La IA da información médica a los pacientes?',
    a: 'No. El agente atiende lo administrativo y comercial: horarios, ubicación, precios de valoración, agendado y seguimiento. Cualquier pregunta clínica se transfiere a tu equipo profesional. La IA no da diagnósticos médicos ni sustituye a profesionales de la salud.',
  },
  {
    q: '¿Qué pasa si un paciente quiere hablar con una persona?',
    a: 'La conversación pasa a tu equipo en el momento, con todo el contexto de lo ya conversado. El paciente no repite su historia y tu equipo no llega a ciegas.',
  },
  {
    q: '¿Mi recepción pierde el control de la agenda?',
    a: 'No. La agenda sigue siendo tuya: el sistema propone espacios y registra citas, y tu equipo puede intervenir, mover o bloquear horarios en cualquier momento.',
  },
  {
    q: '¿Funciona para mi tipo de clínica?',
    a: 'La lógica de consultas, citas y seguimiento se adapta a dental, estética, salud general y especialidades. El diagnóstico confirma qué módulos aplican a tu operación concreta.',
  },
  {
    q: '¿Cómo protegen la información de mis pacientes?',
    a: 'El sistema maneja solo los datos operativos necesarios (contacto, citas, etapa comercial) con accesos controlados. El expediente clínico permanece en tus sistemas y el tratamiento de datos se describe en el aviso de privacidad.',
  },
];

export default function ClinicasPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  usePageFx(rootRef);

  /* La línea del recorrido se dibuja con el scroll (scrub suave). */
  const recRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const rec = recRef.current;
    if (!rec) return;
    const line = rec.querySelector<HTMLElement>('.rec-line');
    if (!line) return;
    if (prefersReducedMotion()) {
      gsap.set(line, { scaleY: 1 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: rec, start: 'top 70%', end: 'bottom 62%', scrub: 0.5 },
        },
      );
    }, rec);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef}>
      {/* ── Hero ── */}
      <section className="cl-hero site-sec" aria-labelledby="cl-title">
        <div className="site-shell">
          <Eyebrow>ALSAI para clínicas</Eyebrow>
          <MaskHeading
            as="h1"
            id="cl-title"
            className="h-display"
            text="Tu clínica cuida pacientes. **Nosotros hacemos que todo lo demás funcione.**"
          />
          <p className="t-lead" data-fx="rise">
            Conectamos captación, WhatsApp, agenda, CRM y seguimiento para que cada consulta reciba
            atención, cada cita tenga continuidad y tu equipo trabaje con menos carga.
          </p>
          <DiagCta>Descubrir oportunidades en mi clínica</DiagCta>
        </div>
      </section>

      {/* ── Mapa de fugas ── */}
      <section className="site-sec" aria-labelledby="fugas-title">
        <div className="site-shell">
          <Eyebrow>Mapa de fugas frecuentes</Eyebrow>
          <MaskHeading
            id="fugas-title"
            className="h-sec"
            text="Dónde se pierden pacientes **sin que nadie lo note.**"
            style={{ marginTop: 18 }}
          />
          <div className="fugas-grid" data-fx-group>
            {FUGAS.map((f, i) => (
              <div className="fuga" key={f.t}>
                <span className="fuga-drip" style={{ ['--drip-delay' as string]: `${i * 0.35}s` }} aria-hidden="true" />
                <p>
                  <strong>{f.t}</strong>
                  {f.b}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recorrido del paciente ── */}
      <section className="site-sec" aria-labelledby="rec-title">
        <div className="site-shell">
          <Eyebrow>Recorrido del paciente</Eyebrow>
          <MaskHeading
            id="rec-title"
            className="h-sec"
            text="Del primer mensaje **a la recomendación.**"
            style={{ marginTop: 18 }}
          />

          <div className="rec-list" ref={recRef}>
            <span className="rec-line" aria-hidden="true" />
            <div style={{ display: 'contents' }} data-fx-group>
              {RECORRIDO.map((r) => (
                <div className="rec-step" key={r.name}>
                  <h3 className="rec-name">{r.name}</h3>
                  <span className={`rec-chip rec-chip--${r.kind}`}>{r.chip}</span>
                  <p className="rec-note">{r.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rec-legend" data-fx="rise">
            <span className="rec-chip rec-chip--tech">IA / Sistema</span>
            <span className="rec-chip rec-chip--both">Colaboración</span>
            <span className="rec-chip rec-chip--human">Control humano</span>
          </div>
        </div>
      </section>

      {/* ── Demo clínica ── */}
      <section className="site-sec" id="demo-clinica" aria-labelledby="dcl-title">
        <div className="site-shell">
          <Eyebrow>Así se ve en tu clínica</Eyebrow>
          <MaskHeading
            id="dcl-title"
            className="h-sec"
            text="Un paciente escribe en domingo. **El sistema no descansa.**"
            style={{ marginTop: 18 }}
          />
          <SystemDemo script={DEMO_CLINICA} />
        </div>
      </section>

      {/* ── Soluciones en lenguaje clínico ── */}
      <section className="site-sec" aria-labelledby="scl-title">
        <div className="site-shell">
          <Eyebrow>Soluciones para clínicas</Eyebrow>
          <MaskHeading
            id="scl-title"
            className="h-sec"
            text="Los módulos que **tu operación necesita.**"
            style={{ marginTop: 18 }}
          />
          <div className="mods-grid" style={{ marginTop: 'clamp(36px, 5vh, 56px)', gridTemplateColumns: 'repeat(2, 1fr)' }} data-fx-group>
            {SOLUCIONES.map((m) => (
              <article className="g-card mod-card" key={m.title} style={{ minHeight: 0 }}>
                <span className="mod-icon" style={{ marginTop: 0, paddingTop: 0, paddingBottom: 14 }} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d={m.icon} />
                  </svg>
                </span>
                <h3 className="mod-title" style={{ marginTop: 0 }}>{m.title}</h3>
                <p className="mod-body">{m.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Escenarios ── */}
      <section className="site-sec" aria-labelledby="esc-title">
        <div className="site-shell">
          <Eyebrow>Escenarios</Eyebrow>
          <MaskHeading
            id="esc-title"
            className="h-sec"
            text="Cada especialidad, **su propio sistema.**"
            style={{ marginTop: 18 }}
          />
          <div className="oth-grid" data-fx-group>
            {ESCENARIOS.map((e) => (
              <article className="g-card oth-card" key={e.title}>
                <h3 className="mod-title">{e.title}</h3>
                <p className="mod-body">{e.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Implementación ── */}
      <section className="site-sec" aria-labelledby="impl-title">
        <div className="site-shell">
          <Eyebrow>Implementación</Eyebrow>
          <MaskHeading
            id="impl-title"
            className="h-sec"
            text="Sin cambiarlo todo **desde el día uno.**"
            style={{ marginTop: 18 }}
          />
          <div className="impl-grid" data-fx-group>
            {IMPL.map((s) => (
              <div className="impl-step" key={s.t}>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privacidad y control humano ── */}
      <section className="site-sec" aria-labelledby="priv-title">
        <div className="site-shell">
          <Eyebrow>Privacidad y control</Eyebrow>
          <MaskHeading
            id="priv-title"
            className="h-sec"
            text="La tecnología apoya. **Tu equipo decide.**"
            style={{ marginTop: 18 }}
          />
          <div className="priv-card" data-fx="rise">
            <span className="priv-shield" aria-hidden="true">
              <IconShield />
            </span>
            <div>
              <h3>Supervisión y control humano, siempre</h3>
              <p>
                La IA de ALSAI apoya en <strong>captación, atención, organización y seguimiento
                administrativo y comercial</strong>. No da diagnósticos médicos, no receta y no
                sustituye a profesionales de la salud: cada flujo define en qué punto interviene tu
                equipo y qué mensajes requieren aprobación.
              </p>
              <p>
                Los datos de tus pacientes se manejan con accesos controlados y se limitan a lo
                operativo; el expediente clínico permanece en tus sistemas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ sector ── */}
      <section className="site-sec" aria-labelledby="clfaq-title">
        <div className="site-shell">
          <div className="faq-grid">
            <div className="faq-sticky">
              <Eyebrow>Preguntas de clínicas</Eyebrow>
              <MaskHeading
                id="clfaq-title"
                className="h-sec"
                text="Las dudas del **sector salud.**"
                style={{ marginTop: 18 }}
              />
            </div>
            <Accordion items={FAQS} />
          </div>
        </div>
      </section>

      {/* ── Cierre ── */}
      <section className="site-sec cierre" aria-labelledby="clc-title">
        <span className="cierre-glow" aria-hidden="true" />
        <div className="site-shell cierre-inner">
          <Eyebrow>Diagnóstico sin costo</Eyebrow>
          <MaskHeading
            id="clc-title"
            className="h-sec"
            text="Descubre dónde tu clínica está **perdiendo pacientes.**"
            style={{ marginTop: 18 }}
          />
          <p className="t-lead" data-fx="rise">
            En unos minutos, Synthia analiza cómo entran y se pierden tus oportunidades y te
            muestra un mapa con tus áreas prioritarias.
          </p>
          <DiagCta>Descubrir oportunidades en mi clínica</DiagCta>
          <p className="cierre-hint" data-fx="rise">
            Unos minutos. Sin costo. El siguiente paso se conversa por WhatsApp.
          </p>
        </div>
      </section>
    </div>
  );
}
