# n8n · pasos manuales

Todo lo que hay aquí se aplica **a mano en la interfaz de n8n**. No por API:
el SDK de workflows no conserva los nombres de nodo ni las credenciales, así
que reescribir un flujo vivo le quita las credenciales a Google Sheets y a
Gmail y lo deja mudo sin avisar.

## Dónde escribe cada cosa ahora

```
navegador ─┬─→ /api/hubspot-lead  (Vercel, mismo dominio)  → HubSpot
           └─→ webhook n8n        (Railway)                → Sheets + Gmail + WhatsApp
```

Los dos envíos llevan el mismo paquete y son independientes: si n8n está
caído, el lead igual queda en HubSpot, y al revés. Antes el sitio web solo
posteaba a n8n, y por eso ninguna respuesta llegaba al CRM.

## 1. Reemplazar el nodo «Preparar lead»

Workflow **ALSAI · Diagnóstico web** (`6ZVfaoWLxo7JSiGZ`).

1. Abre el nodo Code **Preparar lead**.
2. Confirma que el modo sea **Run Once for Each Item**.
3. Borra el contenido y pega [`preparar-lead.js`](preparar-lead.js) completo.
4. Guarda.

Emite las 51 columnas de la hoja `Leads` en el mismo orden del encabezado,
más `resumen_html` para el correo.

Antes de pegar, `npm run test:n8n` comprueba contra un diagnóstico real que
las 51 columnas salen completas, en orden y con los valores correctos.

## 2. Ajustar el nodo «Guardar en Sheets»

- **Document**: la hoja nueva `ALSAI · Base de diagnósticos`.
- **Sheet**: `Leads`.
- **Mapping**: `Map Automatically` (así se guía por el encabezado).
- **Handling extra data**: cambiar a **Ignore**. Con el valor actual
  (`Insert in new column`) n8n añadiría una columna `resumen_html` al final
  de la hoja en el primer lead.

## 3. Desactivar los dos nodos de HubSpot

**Contacto en HubSpot** y **Tarea diagnóstico en HubSpot**: desactívalos
(clic derecho → Deactivate). El CRM ahora lo escribe la función serverless,
que guarda las 19 respuestas como propiedades filtrables; esos nodos solo
guardaban el resumen en la propiedad estándar `message` y duplicarían el
contacto con menos información.

## 4. Entrega al cliente

Sigue pendiente el HTTP Request tras «Preparar lead» que postea
`={{ $('Webhook diagnóstico').item.json.body }}` al webhook
`/webhook/entrega-cliente-alsai` del workflow **ALSAI · Entrega al cliente**.
