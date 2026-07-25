/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ALTA DE PROPIEDADES DEL DIAGNÓSTICO EN HUBSPOT
 *
 *  Crea los dos grupos y todas las propiedades donde el diagnóstico se
 *  guarda: el resultado del motor y las 19 respuestas, una por pregunta.
 *  El esquema vive en `hubspot-props.mjs`.
 *
 *  Es IDEMPOTENTE y además CONVERGENTE: lo que falta se crea, y lo que ya
 *  existe se actualiza (etiqueta, descripción, orden y opciones nuevas).
 *  Nunca borra opciones ni propiedades: si una opción desapareció del guion,
 *  se conserva para no perder los contactos que ya la tienen guardada.
 *
 *  Uso:
 *    HUBSPOT_TOKEN=pat-na1-xxxx node scripts/hubspot-setup.mjs
 *    HUBSPOT_TOKEN=pat-na1-xxxx node scripts/hubspot-setup.mjs --dry-run
 *
 *  El token es un "private app token" de HubSpot y NO debe subirse al repo.
 *  Necesita el permiso `crm.schemas.contacts.write` (solo para esto: el
 *  flujo diario del diagnóstico no lo usa).
 * ─────────────────────────────────────────────────────────────────────────
 */

import { GRUPOS, TODAS } from './hubspot-props.mjs';

const TOKEN = process.env.HUBSPOT_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');
const API = 'https://api.hubapi.com';

if (!TOKEN) {
  console.error('Falta HUBSPOT_TOKEN. Ejemplo:\n  HUBSPOT_TOKEN=pat-na1-xxx node scripts/hubspot-setup.mjs');
  process.exit(1);
}

async function hs(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const texto = await res.text();
  let cuerpo = null;
  try { cuerpo = texto ? JSON.parse(texto) : null; } catch { cuerpo = { raw: texto }; }
  return { ok: res.ok, status: res.status, cuerpo };
}

/**
 * ¿Hay que tocar la propiedad que ya existe?
 * Devuelve el parche mínimo, o `null` si está al día. Las opciones se
 * FUSIONAN: las que ya no están en el guion se conservan (hay contactos
 * guardados con ellas y borrarlas vaciaría su ficha).
 */
function calcularParche(actual, deseada) {
  const parche = {};

  if (actual.label !== deseada.label) parche.label = deseada.label;
  if ((actual.description ?? '') !== (deseada.description ?? '')) {
    parche.description = deseada.description;
  }
  if (deseada.displayOrder !== undefined && actual.displayOrder !== deseada.displayOrder) {
    parche.displayOrder = deseada.displayOrder;
  }
  if (actual.groupName !== deseada.groupName) parche.groupName = deseada.groupName;

  if (deseada.options?.length) {
    const existentes = actual.options ?? [];
    const conocidas = new Set(existentes.map((o) => o.value));
    const nuevas = deseada.options.filter((o) => !conocidas.has(o.value));
    const huerfanas = existentes.filter(
      (o) => !deseada.options.some((d) => d.value === o.value),
    );
    if (nuevas.length) {
      /* Las huérfanas se mandan al final para que no estorben en el menú. */
      parche.options = [
        ...deseada.options,
        ...huerfanas.map((o, i) => ({
          label: o.label,
          value: o.value,
          displayOrder: deseada.options.length + i,
          hidden: o.hidden ?? false,
        })),
      ];
      parche._nuevas = nuevas.map((o) => o.value);
    }
  }

  return Object.keys(parche).length ? parche : null;
}

async function main() {
  console.log(DRY_RUN ? '── SIMULACIÓN (no se escribe nada) ──\n' : '── Configurando HubSpot ──\n');

  /*
   * 1. Verificar el token probando la API real.
   *
   * OJO: /oauth/v1/access-tokens/{token} NO sirve aquí — ese endpoint es para
   * tokens de OAuth y rechaza los de app privada ("must have the correct
   * format"). La forma fiable es llamar a los endpoints que vamos a usar.
   */
  const sondas = [
    ['Contactos (lectura)', '/crm/v3/objects/contacts?limit=1', 'crm.objects.contacts.read'],
    ['Empresas (lectura)', '/crm/v3/objects/companies?limit=1', 'crm.objects.companies.read'],
    ['Negocios (lectura)', '/crm/v3/objects/deals?limit=1', 'crm.objects.deals.read'],
    ['Pipelines de negocio', '/crm/v3/pipelines/deals', 'crm.objects.deals.read'],
    ['Propiedades', '/crm/v3/properties/contacts', 'crm.schemas.contacts.read'],
  ];

  const sinPermiso = [];
  for (const [nombre, path, permiso] of sondas) {
    const r = await hs(path);
    if (r.ok) {
      console.log(`  ✔ ${nombre}`);
    } else if (r.status === 401) {
      console.error(`\nEl token no es válido (401). Revisa que esté bien copiado y completo.`);
      return 1;
    } else {
      console.log(`  ✘ ${nombre} — falta el permiso ${permiso}`);
      sinPermiso.push(permiso);
    }
  }

  if (sinPermiso.length) {
    console.error(`\nAgrega estos permisos a la app en HubSpot y vuelve a intentarlo:`);
    console.error('  ' + [...new Set(sinPermiso)].join('\n  '));
    console.error('\nHubSpot › Configuración › Integraciones › Apps privadas › Diagnostico Landing › Permisos.');
    return 1;
  }
  console.log('\nToken válido y con permisos de lectura correctos.');

  // 2. Grupos de propiedades.
  const grupos = await hs('/crm/v3/properties/contacts/groups');
  const existentes = new Set((grupos.cuerpo?.results ?? []).map((g) => g.name));

  console.log('');
  for (const grupo of GRUPOS) {
    if (existentes.has(grupo.name)) {
      console.log(`  = grupo ${grupo.name.padEnd(20)} ya existía`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`  + grupo ${grupo.name.padEnd(20)} SE CREARÍA`);
      continue;
    }
    const r = await hs('/crm/v3/properties/contacts/groups', {
      method: 'POST',
      body: JSON.stringify(grupo),
    });
    console.log(`  ${r.ok ? '+' : '!'} grupo ${grupo.name.padEnd(20)} ${r.ok ? 'creado' : 'ERROR ' + JSON.stringify(r.cuerpo?.message ?? r.cuerpo)}`);
    if (!r.ok) return 1;
  }

  // 3. Propiedades.
  const actuales = await hs('/crm/v3/properties/contacts');
  const porNombre = new Map((actuales.cuerpo?.results ?? []).map((p) => [p.name, p]));

  let creadas = 0, actualizadas = 0, intactas = 0, fallidas = 0;
  console.log('');
  for (const prop of TODAS) {
    const actual = porNombre.get(prop.name);

    if (!actual) {
      if (DRY_RUN) {
        console.log(`  + ${prop.name.padEnd(34)} SE CREARÍA (${prop.type})`);
        creadas++;
        continue;
      }
      const r = await hs('/crm/v3/properties/contacts', { method: 'POST', body: JSON.stringify(prop) });
      if (r.ok) { console.log(`  + ${prop.name.padEnd(34)} creada`); creadas++; }
      else { console.log(`  ! ${prop.name.padEnd(34)} ERROR ${r.status}: ${JSON.stringify(r.cuerpo?.message ?? r.cuerpo)}`); fallidas++; }
      continue;
    }

    const parche = calcularParche(actual, prop);
    if (!parche) { intactas++; continue; }

    const { _nuevas, ...cuerpo } = parche;
    const detalle = [
      ...Object.keys(cuerpo).filter((k) => k !== 'options'),
      ...(_nuevas ? [`+${_nuevas.length} opciones`] : []),
    ].join(', ');

    if (DRY_RUN) {
      console.log(`  ~ ${prop.name.padEnd(34)} SE ACTUALIZARÍA (${detalle})`);
      actualizadas++;
      continue;
    }
    const r = await hs(`/crm/v3/properties/contacts/${prop.name}`, {
      method: 'PATCH', body: JSON.stringify(cuerpo),
    });
    if (r.ok) { console.log(`  ~ ${prop.name.padEnd(34)} actualizada (${detalle})`); actualizadas++; }
    else { console.log(`  ! ${prop.name.padEnd(34)} ERROR ${r.status}: ${JSON.stringify(r.cuerpo?.message ?? r.cuerpo)}`); fallidas++; }
  }

  console.log(`\nResumen: ${creadas} creadas · ${actualizadas} actualizadas · ${intactas} ya estaban al día · ${fallidas} con error`);
  if (fallidas) return 1;
  if (!DRY_RUN) console.log('\nListo. Ya puedes desplegar con HUBSPOT_TOKEN configurado en Vercel.');
  return 0;
}

/* Se devuelve el código en vez de llamar a process.exit() a media ejecución:
 * cortar con peticiones aún abiertas provoca un fallo de libuv en Windows. */
main()
  .then((codigo) => { process.exitCode = codigo ?? 0; })
  .catch((e) => {
    console.error('Fallo inesperado:', e);
    process.exitCode = 1;
  });
