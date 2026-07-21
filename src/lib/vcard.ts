import { site } from '../config/site';

/**
 * Genera y descarga la vCard del fundador.
 * Devuelve false si aún no hay datos reales de contacto configurados
 * (no se inventan teléfonos ni correos).
 */
export function saveFounderContact(): boolean {
  const { founder, brand, links } = site;
  if (!founder.phone && !founder.email) return false;

  const parts = founder.name.trim().split(/\s+/);
  const first = parts[0] ?? '';
  const last = parts.slice(1).join(' ');

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${last};${first};;;`,
    `FN:${founder.name}`,
    `ORG:${brand.name}`,
    `TITLE:${founder.role}`,
    founder.phone ? `TEL;TYPE=CELL:${founder.phone}` : '',
    founder.email ? `EMAIL:${founder.email}` : '',
    links.website ? `URL:${links.website}` : '',
    `ADR;TYPE=WORK:;;;Querétaro;Querétaro;;México`,
    'END:VCARD',
  ].filter(Boolean);

  const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'carlos-alvarez-alsai.vcf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}
