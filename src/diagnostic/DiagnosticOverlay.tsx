import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { gsap } from 'gsap';
import { site } from '../config/site';
import { track } from '../lib/analytics';
import { prefersReducedMotion } from '../lib/useReveal';
import { toast } from '../lib/toast';
import { IconCalendar, IconCheck, IconClose } from '../components/icons';
import type { ColorEtapa, EtapaKey, Impacto } from './engine/scoring';
import type { FieldValue, LeadData, StepAnswers, StepField } from './types';
import type { DiagnosticController } from './useDiagnostic';

/* ── Transición entre etapas: salida rápida, entrada suave ──────────── */

function useStagedKey(key: string) {
  const [shown, setShown] = useState(key);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (key === shown) return;
    setLeaving(true);
    const t = window.setTimeout(() => {
      setShown(key);
      setLeaving(false);
    }, 170);
    return () => window.clearTimeout(t);
  }, [key, shown]);

  return { shown, leaving };
}

/* ── Barra de progreso ──────────────────────────────────────────────── */

function ProgressBar({ controller }: { controller: DiagnosticController }) {
  const { progress, phase } = controller.state;
  const done =
    phase === 'ready' || phase === 'resultado' || phase === 'lead' || phase === 'submitting';
  const value = done ? 1 : progress;

  /* Durante las preguntas solo avanza la barra: sin contadores ni porcentaje. */
  let caption = '';
  if (phase === 'ready') caption = 'Análisis completado';
  else if (phase === 'resultado') caption = 'Análisis completado';
  else if (phase === 'lead' || phase === 'submitting') caption = 'Diagnóstico completo';

  return (
    <div className="diag-rail" aria-hidden={phase === 'welcome' ? true : undefined}>
      <div
        className={`rail-bar${phase === 'analyzing' ? ' is-analyzing' : ''}${done ? ' is-done' : ''}`}
        role="progressbar"
        aria-valuenow={Math.round(value * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="rail-fill" style={{ transform: `scaleX(${value})` }} />
        {value > 0.001 && (
          <span className="rail-head" style={{ left: `${value * 100}%` }} />
        )}
      </div>
      {caption && <p className="rail-caption">{caption}</p>}
    </div>
  );
}

/* ── Etapa: bienvenida ──────────────────────────────────────────────── */

function WelcomePanel({ controller }: { controller: DiagnosticController }) {
  const { busy, error } = controller.state;
  return (
    <div className="diag-panel">
      <p className="microlabel diag-kicker">{site.brand.name}</p>
      <h2 className="diag-title">Descubre el potencial de tu negocio.</h2>
      <p className="diag-copy">
        En unos minutos identificamos dónde tu clínica o negocio de servicios está perdiendo
        oportunidades, y te mostramos un mapa con tus áreas prioritarias. Al terminar,
        continuamos por WhatsApp con tu diagnóstico y una propuesta de reunión.
      </p>

      {error && <p className="diag-error" role="alert">{error}</p>}

      <button className="diag-btn-primary is-accent" onClick={controller.begin} disabled={busy}>
        {busy ? <span className="spinner" aria-label="Cargando" /> : 'Descubrir mi potencial'}
      </button>
    </div>
  );
}

/* ── Etapa: pregunta ────────────────────────────────────────────────── */

/** Escala 0–10 con salidas ("No lo sabemos", "No aplica…"). */
function ScaleField({
  field,
  value,
  onChange,
}: {
  field: StepField;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
}) {
  const active = typeof value === 'number' ? value : -1;
  return (
    <>
      <div className="scale-row" role="group" aria-label="Selecciona de 0 a 10">
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            className={`scale-dot${active === n ? ' is-on' : ''}`}
            style={{ animationDelay: `${60 + n * 26}ms` }}
            onClick={() => onChange(n)}
            aria-pressed={active === n}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="scale-legend">
        <span>0 · ninguna</span>
        <span>10 · todas</span>
      </p>
      <div className="diag-chips">
        {(field.escapes ?? []).map((esc, i) => (
          <button
            key={esc}
            className={`diag-chip is-escape${value === esc ? ' is-on' : ''}`}
            style={{ animationDelay: `${360 + i * 55}ms` }}
            onClick={() => onChange(esc)}
          >
            {esc}
          </button>
        ))}
      </div>
    </>
  );
}

function QuestionModule({ controller }: { controller: DiagnosticController }) {
  const { step, error } = controller.state;
  const [values, setValues] = useState<StepAnswers>({});

  if (!step) return null;

  const set = (id: string, v: FieldValue) => setValues((s) => ({ ...s, [id]: v }));

  const toggleMulti = (field: StepField, option: string) => {
    const current = Array.isArray(values[field.id]) ? (values[field.id] as string[]) : [];
    const has = current.includes(option);
    if (!has && field.maxSelect && current.length >= field.maxSelect) return;
    set(field.id, has ? current.filter((o) => o !== option) : [...current, option]);
  };

  const isAnswered = (f: StepField): boolean => {
    const v = values[f.id];
    if (f.kind === 'multi') return Array.isArray(v) && v.length > 0;
    return v !== undefined && v !== '';
  };

  const complete = step.fields.every(isAnswered);

  const summarize = (): string =>
    step.fields
      .map((f) => {
        const v = values[f.id];
        return Array.isArray(v) ? v.join(', ') : String(v);
      })
      .join(' · ');

  const send = (next: StepAnswers = values) => {
    const summary = step.fields
      .map((f) => {
        const v = next[f.id];
        return Array.isArray(v) ? v.join(', ') : String(v);
      })
      .join(' · ');
    void controller.answer(next, summary);
  };

  /** Un solo campo de opción única: el toque avanza de inmediato. */
  const instant = step.fields.length === 1 && step.fields[0].kind === 'single';

  return (
    <div className="diag-panel">
      <h2 className="diag-title">{step.title}</h2>
      {step.note && <p className="diag-note">{step.note}</p>}

      {error && (
        <p className="diag-error" role="alert">
          {error}
        </p>
      )}

      {step.fields.map((field) => (
        <div className="diag-field" key={field.id}>
          {field.label && <p className="field-question">{field.label}</p>}

          {field.kind === 'scale' ? (
            <ScaleField field={field} value={values[field.id]} onChange={(v) => set(field.id, v)} />
          ) : (
            <>
              {field.kind === 'multi' && (
                <p className="field-hint">
                  {field.maxSelect
                    ? `Elige hasta ${field.maxSelect}`
                    : 'Elige todas las que apliquen'}
                </p>
              )}
              <div className="diag-chips">
                {(field.options ?? []).map((option, i) => {
                  const v = values[field.id];
                  const on =
                    field.kind === 'multi'
                      ? Array.isArray(v) && v.includes(option)
                      : v === option;
                  return (
                    <button
                      key={option}
                      className={`diag-chip${on ? ' is-on' : ''}`}
                      style={{ animationDelay: `${80 + i * 40}ms` }}
                      aria-pressed={on}
                      onClick={() => {
                        if (field.kind === 'multi') {
                          toggleMulti(field, option);
                        } else if (instant) {
                          send({ [field.id]: option });
                        } else {
                          set(field.id, option);
                        }
                      }}
                    >
                      {on && field.kind === 'multi' && <IconCheck width={14} height={14} />}
                      {option}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ))}

      {!instant && (
        <button className="diag-btn-primary" disabled={!complete} onClick={() => send()}>
          Continuar
        </button>
      )}

      {!instant && complete && <p className="diag-summary-hint">{summarize()}</p>}
    </div>
  );
}

/* ── Etapa: análisis ────────────────────────────────────────────────── */

function AnalysisCard({ controller }: { controller: DiagnosticController }) {
  const { lastAnswer, analysisNote } = controller.state;
  return (
    <div className="diag-panel">
      <div className="analysis-card">
        <span className="scan-line" aria-hidden="true" />
        <p className="microlabel">Respuesta registrada</p>
        <p className="analysis-answer">
          <IconCheck width={15} height={15} />
          {lastAnswer}
        </p>
        <p className="analysis-note">{analysisNote}</p>
        <div className="analysis-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

/* ── Etapa: resultados inmediatos (motor de scoring local) ──────────── */

const ETAPAS_MAPA: { key: EtapaKey; label: string }[] = [
  { key: 'captacion', label: 'Captación' },
  { key: 'respuesta', label: 'Respuesta' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'asistencia', label: 'Asistencia' },
  { key: 'conversion', label: 'Tratamiento' },
  { key: 'recuperacion', label: 'Recuperación' },
];

const ESTADO_ETAPA: Record<ColorEtapa, string> = {
  verde: 'Funciona bien',
  amarillo: 'Oportunidad',
  rojo: 'Fuga importante',
  gris: 'Sin datos',
};

const mxn = (v: number) => `$${v.toLocaleString('es-MX')}`;

/** Panel "Ver fórmulas": transparencia total de cada número mostrado. */
function FormulasPanel({ impacto }: { impacto: Impacto }) {
  return (
    <div className="formulas-panel">
      {impacto.desglose.map((p) => (
        <div className="formula-block" key={p.id}>
          <p className="formula-nombre">{p.nombre}</p>
          <p className="formula-eq">{p.formula}</p>
          <ul className="formula-datos">
            {p.datos.map((d) => (
              <li key={p.id + d.etiqueta}>
                <span className="dato-etiqueta">{d.etiqueta}</span>
                <span className="dato-origen">
                  {d.respuesta !== '—' ? `“${d.respuesta}” → ` : ''}
                  {d.valor}
                </span>
              </li>
            ))}
          </ul>
          <p className="formula-calculo">{p.calculo_bajo}</p>
          <p className="formula-calculo">{p.calculo_alto}</p>
        </div>
      ))}
      {impacto.nota_total && <p className="formula-total">{impacto.nota_total}</p>}
      {impacto.notas.map((n) => (
        <p className="formula-nota" key={n}>
          {n}
        </p>
      ))}
    </div>
  );
}

function ImpactBlock({ impacto }: { impacto: Impacto }) {
  const [verFormulas, setVerFormulas] = useState(false);

  if (impacto.modo === 'insuficiente') {
    return (
      <div className="impact-card is-empty">
        <p className="impact-note">{impacto.etiqueta}</p>
      </div>
    );
  }

  if (impacto.modo === 'pesos' && (impacto.dinero_max ?? 0) <= 0) {
    return (
      <div className="impact-card is-empty">
        <p className="impact-note">
          Con tus respuestas no detectamos una fuga económica relevante: tu proceso está bien
          afinado.
        </p>
      </div>
    );
  }

  const esPesos = impacto.modo === 'pesos';
  const min = (esPesos ? impacto.dinero_min : impacto.volumen_min) ?? 0;
  const max = (esPesos ? impacto.dinero_max : impacto.volumen_max) ?? 0;
  const figura = esPesos
    ? min > 0
      ? min === max
        ? mxn(max)
        : `${mxn(min)} a ${mxn(max)}`
      : `Hasta ${mxn(max)}`
    : min === max
      ? String(max)
      : `${min} a ${max}`;

  return (
    <div className="impact-card">
      <p className="microlabel">{impacto.etiqueta}</p>
      <p className="impact-figure">
        {figura}
        <span className="impact-unit">{esPesos ? ' MXN al mes' : ' oportunidades de cita'}</span>
      </p>
      <p className="impact-note">
        {esPesos
          ? 'Estimación conservadora en rango, calculada únicamente con tus respuestas.'
          : 'Para traducirlo a dinero nos faltó el valor de tus citas o tratamientos; lo afinamos contigo.'}
      </p>

      {impacto.desglose.length > 0 && (
        <button
          className="formulas-toggle"
          aria-expanded={verFormulas}
          onClick={() => {
            if (!verFormulas) track('formulas_opened');
            setVerFormulas((v) => !v);
          }}
        >
          {verFormulas ? 'Ocultar fórmulas' : 'Ver fórmulas'}
        </button>
      )}
      {verFormulas && <FormulasPanel impacto={impacto} />}
    </div>
  );
}

function ResultsPanel({ controller }: { controller: DiagnosticController }) {
  const { result } = controller.state;
  if (!result) return null;

  return (
    <div className="diag-panel diag-result">
      <p className="microlabel diag-kicker">Resultados iniciales</p>
      <h2 className="diag-title">Así fluye hoy el recorrido de tus pacientes</h2>

      <ol className="result-map">
        {ETAPAS_MAPA.map(({ key, label }, i) => {
          const etapa = result.etapas[key];
          return (
            <li
              key={key}
              className={`map-stage is-${etapa.color}`}
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              <span className="map-dot" aria-hidden="true" />
              <div className="map-body">
                <p className="map-name">
                  {label}
                  <span className="map-state">{ESTADO_ETAPA[etapa.color]}</span>
                </p>
                <p className="map-conclusion">{etapa.conclusion}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <ImpactBlock impacto={result.impacto} />

      <button className="diag-btn-primary is-accent" onClick={controller.continueToLead}>
        Conocer mis dos rutas de mejora
      </button>
      <p className="result-followup">
        Te las enviamos por WhatsApp junto con el análisis completo de cada etapa.
      </p>
    </div>
  );
}

/* ── Etapa: captura de datos ────────────────────────────────────────── */

interface FieldErrors {
  name?: string;
  clinic?: string;
  whatsapp?: string;
  email?: string;
  consent?: string;
}

function LeadForm({ controller }: { controller: DiagnosticController }) {
  const busy = controller.state.phase === 'submitting';
  const { error } = controller.state;
  const [form, setForm] = useState<LeadData>({
    name: '',
    clinic: '',
    whatsapp: '',
    email: '',
    consent: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const set = (k: keyof LeadData, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: FieldErrors = {};
    if (form.name.trim().length < 2) next.name = 'Escribe tu nombre.';
    if (form.clinic.trim().length < 2) next.clinic = 'Escribe el nombre de la clínica.';
    if (form.whatsapp.replace(/\D/g, '').length < 10) next.whatsapp = 'Escribe un WhatsApp de 10 dígitos.';
    if (!form.email.trim()) next.email = 'Escribe tu correo.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Ese correo no parece válido.';
    if (!form.consent) next.consent = 'Necesitamos tu consentimiento para contactarte.';
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    void controller.submitLead({ ...form, whatsapp: form.whatsapp.replace(/\D/g, '') });
  };

  const privacy = () => {
    if (site.links.privacy) {
      window.open(site.links.privacy, '_blank', 'noopener,noreferrer');
    } else {
      toast('El aviso de privacidad estará disponible muy pronto');
    }
  };

  return (
    <div className="diag-panel">
      <p className="microlabel diag-kicker">Último paso</p>
      <h2 className="diag-title">Tus dos rutas de mejora están casi listas</h2>
      <p className="diag-copy dim">Dinos a dónde enviarlas junto con tu diagnóstico completo.</p>

      {error && <p className="diag-error" role="alert">{error}</p>}

      <form className="diag-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="f-name">Nombre</label>
          <input
            id="f-name"
            className="diag-input"
            autoComplete="name"
            value={form.name}
            disabled={busy}
            onChange={(e) => set('name', e.target.value)}
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div className="field">
          <label htmlFor="f-clinic">Clínica</label>
          <input
            id="f-clinic"
            className="diag-input"
            autoComplete="organization"
            value={form.clinic}
            disabled={busy}
            onChange={(e) => set('clinic', e.target.value)}
          />
          {errors.clinic && <p className="field-error">{errors.clinic}</p>}
        </div>

        <div className="field">
          <label htmlFor="f-wa">WhatsApp</label>
          <input
            id="f-wa"
            className="diag-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="10 dígitos"
            value={form.whatsapp}
            disabled={busy}
            onChange={(e) => set('whatsapp', e.target.value)}
          />
          {errors.whatsapp && <p className="field-error">{errors.whatsapp}</p>}
        </div>

        <div className="field">
          <label htmlFor="f-mail">Correo</label>
          <input
            id="f-mail"
            className="diag-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            disabled={busy}
            onChange={(e) => set('email', e.target.value)}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <label className={`consent${form.consent ? ' is-on' : ''}`}>
          <input
            type="checkbox"
            checked={form.consent}
            disabled={busy}
            onChange={(e) => set('consent', e.target.checked)}
          />
          <span className="consent-box" aria-hidden="true">
            <IconCheck width={13} height={13} />
          </span>
          <span className="consent-text">
            Acepto el{' '}
            <button type="button" className="consent-link" onClick={privacy}>
              aviso de privacidad
            </button>{' '}
            y que ALSAI me contacte sobre este diagnóstico.
          </span>
        </label>
        {errors.consent && <p className="field-error">{errors.consent}</p>}

        <button type="submit" className="diag-btn-primary" disabled={busy}>
          {busy ? <span className="spinner" aria-label="Enviando" /> : 'Recibir mi diagnóstico'}
        </button>
      </form>
    </div>
  );
}

/* ── Etapa: cierre ──────────────────────────────────────────────────── */

function ReadyPanel({
  controller,
  onRequestClose,
}: {
  controller: DiagnosticController;
  onRequestClose: () => void;
}) {
  const { lead, meeting, error } = controller.state;
  return (
    <div className="diag-panel diag-ready">
      <svg className="seal" viewBox="0 0 72 72" aria-hidden="true">
        <circle className="seal-ring" cx="36" cy="36" r="31" pathLength="100" />
        <path className="seal-check" d="M24 37.5l8.5 8.5L49 28" pathLength="100" />
      </svg>

      <h2 className="diag-title center">Diagnóstico en proceso</h2>
      <p className="diag-copy center">
        Gracias{lead?.name ? `, ${lead.name.split(' ')[0]}` : ''}. Analizaremos las respuestas
        {lead?.clinic ? ` de ${lead.clinic}` : ''} y te enviaremos el diagnóstico por WhatsApp.
      </p>

      {error && <p className="diag-error" role="alert">{error}</p>}

      {meeting === 'done' ? (
        <p className="meeting-done">
          <IconCheck width={15} height={15} />
          Solicitud registrada — te contactaremos para agendar.
        </p>
      ) : (
        <button
          className="diag-btn-primary"
          onClick={() => void controller.requestMeeting()}
          disabled={meeting === 'requesting'}
        >
          {meeting === 'requesting' ? (
            <span className="spinner" aria-label="Enviando" />
          ) : (
            <>
              <IconCalendar />
              Solicitar reunión con Carlos
            </>
          )}
        </button>
      )}

      <button className="diag-btn-ghost" onClick={onRequestClose}>
        Volver al sitio
      </button>
    </div>
  );
}

/* ── Overlay raíz con morph desde el CTA ────────────────────────────── */

export function DiagnosticOverlay({ controller }: { controller: DiagnosticController }) {
  const { isOpen, originRect, phase } = controller.state;
  const shellRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  const stageKey: string = phase === 'submitting' ? 'lead' : phase;
  const { shown, leaving } = useStagedKey(stageKey);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const inner = innerRef.current;
    if (!isOpen || !shell || !inner) return;

    closingRef.current = false;
    document.body.style.overflow = 'hidden';

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = originRect;
    const from = r
      ? `inset(${r.top}px ${vw - r.right}px ${vh - r.bottom}px ${r.left}px round 22px)`
      : `inset(42% 8% 42% 8% round 24px)`;

    if (prefersReducedMotion()) {
      gsap.set(shell, { clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 });
      gsap.set(inner, { opacity: 1, y: 0 });
    } else {
      gsap.set(shell, { opacity: 1 });
      gsap
        .timeline()
        .fromTo(
          shell,
          { clipPath: from },
          { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.55, ease: 'expo.out' },
        )
        .fromTo(
          inner,
          { opacity: 0, y: 16, filter: 'blur(7px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out' },
          0.16,
        );
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, originRect]);

  const requestClose = () => {
    const shell = shellRef.current;
    const inner = innerRef.current;
    if (!shell || !inner || closingRef.current) return;
    closingRef.current = true;

    if (prefersReducedMotion()) {
      controller.close();
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = controller.state.originRect;
    const to = r
      ? `inset(${r.top}px ${vw - r.right}px ${vh - r.bottom}px ${r.left}px round 22px)`
      : `inset(42% 8% 42% 8% round 24px)`;

    gsap
      .timeline({ onComplete: () => controller.close() })
      .to(inner, { opacity: 0, y: 10, duration: 0.16, ease: 'power2.in' })
      .to(shell, { clipPath: to, duration: 0.36, ease: 'power3.inOut' }, 0.06)
      .to(shell, { opacity: 0, duration: 0.14, ease: 'power1.in' }, 0.34);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const panels: Record<string, ReactNode> = {
    welcome: <WelcomePanel controller={controller} />,
    question: <QuestionModule controller={controller} />,
    analyzing: <AnalysisCard controller={controller} />,
    resultado: <ResultsPanel controller={controller} />,
    lead: <LeadForm controller={controller} />,
    ready: <ReadyPanel controller={controller} onRequestClose={requestClose} />,
  };

  return (
    <div
      ref={shellRef}
      className="diag-shell"
      role="dialog"
      aria-modal="true"
      aria-label="Diagnóstico estratégico"
    >
      <div ref={innerRef} className="diag-inner">
        <header className="diag-header">
          <span className="hero-brand">
            <span className="signal-dot" aria-hidden="true" />
            <span className="microlabel">Diagnóstico estratégico</span>
          </span>
          <button className="diag-close" onClick={requestClose} aria-label="Cerrar diagnóstico">
            <IconClose />
          </button>
        </header>

        <ProgressBar controller={controller} />

        <div className="diag-content">
          <div key={shown} className={`stage ${leaving ? 'stage-leave' : 'stage-enter'}`}>
            {panels[shown]}
          </div>
        </div>
      </div>
    </div>
  );
}
