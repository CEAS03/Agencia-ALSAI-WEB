/**
 * Definición del ecosistema: nodos, posiciones y rutas de conexión.
 * ─ nx: posición horizontal normalizada (-1 … 1) relativa al ancho visible
 *   a la profundidad z del nodo (se adapta a cualquier aspect ratio).
 * ─ ny: posición vertical en unidades de mundo (el scroll recorre este eje).
 * ─ z:  profundidad; mayor = más cerca de la cámara.
 *
 * Las rutas son configurables: cada una es una lista ordenada de ids y
 * representa un flujo de negocio real. Editar aquí no requiere tocar la escena.
 */

export interface EcoNodeDef {
  id: string;
  label: string;
  /** Trazos SVG (viewBox 24) que dibujan el glifo. */
  paths: string[];
  nx: number;
  ny: number;
  z: number;
  /** Escala relativa del nodo. */
  size: number;
}

export const ECO_NODES: EcoNodeDef[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    paths: [
      'M12 4.5a7.5 7.5 0 0 0-6.42 11.38L4.6 19.4l3.62-.94A7.5 7.5 0 1 0 12 4.5Z',
      'M9.6 8.9l.95 1.85-.95 1.05a6.2 6.2 0 0 0 2.6 2.6l1.05-.95 1.85.95c-.35 1.2-1.45 1.85-2.65 1.5a7.1 7.1 0 0 1-4.35-4.35c-.35-1.2.3-2.3 1.5-2.65Z',
    ],
    nx: -0.68, ny: 3.7, z: 1.2, size: 1.14,
  },
  {
    // Nodo superior del hero: muestra "más clientes" (persona +) — WhatsApp conecta aquí.
    id: 'ia',
    label: 'Prospectos',
    paths: [
      'M9.6 11.4a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z',
      'M4.2 19.4c.7-3.1 2.8-4.7 5.4-4.7s4.7 1.6 5.4 4.7',
      'M17.2 8.2h4.2M19.3 6.1v4.2',
    ],
    nx: 0.56, ny: 4.5, z: -0.8, size: 1.2,
  },
  {
    // Bajo el nodo de "más clientes": agenda (calendario) — clientes agendados.
    id: 'crm',
    label: 'Agenda',
    paths: [
      'M5 7.2h14a1.4 1.4 0 0 1 1.4 1.4v9.6a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6V8.6A1.4 1.4 0 0 1 5 7.2Z',
      'M3.6 11h16.8',
      'M8.3 4.4v3M15.7 4.4v3',
      'M12 15.4h4',
    ],
    nx: 0.74, ny: 2.2, z: 0.4, size: 1.16,
  },
  {
    // El glifo de CRM (capas) se reubica aquí para no duplicar el de la agenda.
    id: 'agenda',
    label: 'CRM',
    paths: [
      'M12 4.4 19.6 8.6 12 12.8 4.4 8.6 12 4.4Z',
      'M4.4 12.6l7.6 4.2 7.6-4.2',
      'M4.4 16.4l7.6 4.2 7.6-4.2',
    ],
    nx: -0.5, ny: 0.9, z: -1.8, size: 0.82,
  },
  {
    // El glifo de IA (destello) se reubica aquí para no duplicar el de "más clientes".
    id: 'prospectos',
    label: 'Inteligencia artificial',
    paths: [
      'M12 4.6l1.75 5.65L19.4 12l-5.65 1.75L12 19.4l-1.75-5.65L4.6 12l5.65-1.75L12 4.6Z',
      'M18.2 5.2v3.2M16.6 6.8h3.2',
    ],
    nx: 0.6, ny: -0.7, z: -1.2, size: 1.05,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    paths: [
      'M4.6 13.6v-3.2L16 6v12L4.6 13.6Z',
      'M7.8 14.4v2.6c0 .85.6 1.55 1.45 1.7l1.55.25',
      'M18.6 9.4a4.3 4.3 0 0 1 0 5.2',
    ],
    nx: -0.74, ny: -1.7, z: 0.8, size: 1.08,
  },
  {
    id: 'seguimiento',
    label: 'Seguimiento',
    paths: [
      'M18.6 8.8A7 7 0 0 0 6.2 7.6L4.8 9.6',
      'M4.6 5.6v4h4',
      'M5.4 15.2a7 7 0 0 0 12.4 1.2l1.4-2',
      'M19.4 18.4v-4h-4',
    ],
    nx: 0.42, ny: -2.9, z: -0.4, size: 1.07,
  },
  {
    id: 'resenas',
    label: 'Reseñas',
    paths: [
      'M12 4.8l2.2 4.6 5 .7-3.6 3.5.85 5-4.45-2.4-4.45 2.4.85-5L4.8 10.1l5-.7L12 4.8Z',
    ],
    nx: -0.36, ny: -4.3, z: -1.6, size: 0.8,
  },
  {
    id: 'administracion',
    label: 'Administración',
    paths: [
      'M4.4 8.2h9.4M17.6 8.2h2M15.6 6.2v4',
      'M4.4 15.8h4M12.2 15.8h7.4M10.2 13.8v4',
    ],
    nx: 0.72, ny: -5, z: 0.6, size: 0.78,
  },
  {
    id: 'ventas',
    label: 'Ventas',
    paths: [
      'M4.4 17.2l5-5 3.5 3.5 6.7-7.2',
      'M19.6 8.5V13M19.6 8.5H15',
    ],
    nx: -0.66, ny: -6.4, z: -0.6, size: 1.12,
  },
  {
    id: 'automatizacion',
    label: 'Automatizaciones',
    paths: ['M13.2 3.8 5.6 13.6h5.2l-1 6.6 7.6-9.8h-5.2l1-6.6Z'],
    nx: 0.32, ny: -7.4, z: 0.9, size: 0.9,
  },
  {
    id: 'analitica',
    label: 'Analítica de datos',
    paths: ['M6 19v-6M12 19V7.6M18 19v-8.4', 'M4.2 19.6h15.6'],
    nx: -0.28, ny: -8.3, z: -1.4, size: 0.84,
  },
];

/** Puntos ambientales sin icono: dan densidad y profundidad. */
export const ECO_AMBIENT: { nx: number; ny: number; z: number }[] = [
  { nx: -0.15, ny: 5.2, z: -2.4 },
  { nx: 0.85, ny: 0.6, z: -2.2 },
  { nx: -0.85, ny: -3.2, z: -2.6 },
  { nx: 0.1, ny: -5.8, z: -2.3 },
  { nx: -0.6, ny: 6, z: -1 },
  { nx: 0.7, ny: -8.6, z: -1.8 },
];

/**
 * Rutas de datos con significado de negocio (orden = dirección del impulso).
 * El scheduler las recorre en round-robin; tocar un nodo dispara la suya.
 */
export const ECO_ROUTES: string[][] = [
  ['whatsapp', 'ia', 'crm'],
  ['crm', 'agenda', 'seguimiento'],
  ['marketing', 'prospectos', 'ventas'],
  ['agenda', 'seguimiento', 'resenas'],
  ['analitica', 'marketing', 'automatizacion'],
  ['ia', 'automatizacion', 'administracion'],
];

export type EcoMode = 'hero' | 'diagnostic' | 'analysis' | 'success';
