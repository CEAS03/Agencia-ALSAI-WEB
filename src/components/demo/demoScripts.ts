/**
 * Guiones de la demo "conversación visible / sistema actuando detrás".
 * Datos simulados y marcados como demostración en la UI; no son casos
 * reales ni métricas publicadas.
 */

export type EventKind = 'crm' | 'data' | 'agenda' | 'follow' | 'team' | 'dash';

export interface DemoBubble {
  side: 'in' | 'out';
  time: string;
  lines: string[];
}

export interface DemoEvent {
  kind: EventKind;
  system: string;
  detail: string;
}

export interface DemoStep {
  bubble?: DemoBubble;
  events?: DemoEvent[];
  /** Nota flash sobre el chat (p. ej. velocidad de respuesta). */
  note?: string;
}

export interface DemoScript {
  /** Nombre visible en el encabezado del teléfono. */
  header: string;
  headerSub: string;
  steps: DemoStep[];
}

/* ── Guion Home: prospecto de ortodoncia por WhatsApp ────────────────── */

export const DEMO_HOME: DemoScript = {
  header: 'Clínica Dental — WhatsApp',
  headerSub: 'Agente ALSAI activo · responde 24/7',
  steps: [
    {
      bubble: {
        side: 'in',
        time: '9:47 PM',
        lines: ['Hola, me interesa saber más acerca de los brackets y los precios.'],
      },
      events: [
        { kind: 'crm', system: 'CRM', detail: 'Contacto nuevo registrado · origen: WhatsApp' },
      ],
    },
    {
      bubble: {
        side: 'out',
        time: '9:47 PM',
        lines: [
          '¡Hola! 😊 Con gusto te explico cómo funciona.',
          'Valoración inicial $400 · Colocación desde $5,000 · Ajuste mensual $700.',
          'La duración depende de tu caso: entre 12 y 24 meses.',
        ],
      },
      note: 'Respondió en 8 segundos',
      events: [
        { kind: 'data', system: 'IA', detail: 'Intención detectada: ortodoncia · interés en precios' },
      ],
    },
    {
      bubble: { side: 'in', time: '9:48 PM', lines: ['¿Y las radiografías van aparte?'] },
      events: [
        { kind: 'data', system: 'IA', detail: 'Conversación con contexto: historial completo visible' },
      ],
    },
    {
      bubble: {
        side: 'out',
        time: '9:48 PM',
        lines: [
          'Depende de tu caso: en la valoración el doctor te dice si las necesitas y cuáles.',
          '¿Te late el jueves 4:00 PM o el viernes 11:00 AM?',
        ],
      },
      events: [
        { kind: 'agenda', system: 'Agenda', detail: 'Disponibilidad consultada · 2 horarios propuestos' },
      ],
    },
    {
      bubble: { side: 'in', time: '9:49 PM', lines: ['Jueves 4pm'] },
      events: [
        { kind: 'agenda', system: 'Agenda', detail: 'Espacio del jueves reservado provisionalmente' },
      ],
    },
    {
      bubble: {
        side: 'out',
        time: '9:49 PM',
        lines: ['¡Perfecto! Para registrar tu cita, ¿me compartes tu nombre completo?'],
      },
      events: [
        { kind: 'data', system: 'IA', detail: 'Recopilando datos para completar el registro' },
      ],
    },
    {
      bubble: { side: 'in', time: '9:50 PM', lines: ['Daniel Gutiérrez'] },
      events: [
        { kind: 'crm', system: 'CRM', detail: 'Contacto actualizado: Daniel Gutiérrez · etapa "Cita agendada"' },
      ],
    },
    {
      bubble: {
        side: 'out',
        time: '9:50 PM',
        lines: ['Listo ✅ Cita registrada: jueves 21, 4:00 PM.', 'Te mando un recordatorio un día antes. Nos vemos 👋'],
      },
      events: [
        { kind: 'follow', system: 'Seguimiento', detail: 'Recordatorio y confirmación programados (24 h antes)' },
        { kind: 'team', system: 'Equipo', detail: 'Resumen de la conversación enviado a recepción' },
        { kind: 'dash', system: 'Dashboard', detail: 'Registrado: nueva cita atribuida a su campaña' },
      ],
    },
  ],
};

/* ── Guion Clínicas: paciente de estética fuera de horario ───────────── */

export const DEMO_CLINICA: DemoScript = {
  header: 'Clínica de Estética — WhatsApp',
  headerSub: 'Domingo · fuera de horario de atención',
  steps: [
    {
      bubble: {
        side: 'in',
        time: '8:12 AM',
        lines: ['Hola, ¿hacen limpiezas faciales profundas? ¿Cuánto cuesta?'],
      },
      events: [
        { kind: 'crm', system: 'CRM', detail: 'Paciente potencial registrado · domingo 8:12 AM' },
      ],
    },
    {
      bubble: {
        side: 'out',
        time: '8:12 AM',
        lines: [
          '¡Hola! Sí, con gusto 😊 La limpieza facial profunda inicia con una valoración de piel.',
          'Así la especialista define el protocolo correcto para ti.',
        ],
      },
      note: 'Respondió en domingo, sin equipo en línea',
      events: [
        { kind: 'data', system: 'IA', detail: 'Atención inmediata fuera de horario · sin intervención del equipo' },
      ],
    },
    {
      bubble: { side: 'in', time: '8:14 AM', lines: ['¿Tienen algo entre semana por la tarde?'] },
      events: [
        { kind: 'agenda', system: 'Agenda', detail: 'Preferencia registrada: entre semana, por la tarde' },
      ],
    },
    {
      bubble: {
        side: 'out',
        time: '8:14 AM',
        lines: ['Claro: martes 5:30 PM o miércoles 6:15 PM. ¿Cuál te acomoda mejor?'],
      },
      events: [
        { kind: 'agenda', system: 'Agenda', detail: 'Dos espacios reales propuestos desde la agenda' },
      ],
    },
    {
      bubble: { side: 'in', time: '8:15 AM', lines: ['Miércoles 6:15 está perfecto. Soy Fernanda Ríos.'] },
      events: [
        { kind: 'crm', system: 'CRM', detail: 'Fernanda Ríos · etapa "Valoración agendada"' },
        { kind: 'agenda', system: 'Agenda', detail: 'Cita confirmada: miércoles 6:15 PM' },
      ],
    },
    {
      bubble: {
        side: 'out',
        time: '8:15 AM',
        lines: ['¡Lista tu cita, Fernanda! 🌿 Miércoles 6:15 PM.', 'Un día antes te confirmo por aquí mismo.'],
      },
      events: [
        { kind: 'follow', system: 'Seguimiento', detail: 'Confirmación y recordatorio programados' },
        { kind: 'team', system: 'Equipo', detail: 'Lunes 9:00 AM: recepción ve el resumen completo' },
        { kind: 'dash', system: 'Dashboard', detail: 'Cita captada en fin de semana, visible en métricas' },
      ],
    },
  ],
};
