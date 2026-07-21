# Integración n8n — Diagnóstico ALSAI

## Arquitectura (v2 — 2026-07)

Las 19 preguntas y el motor de scoring corren **100% en el navegador**
(`src/diagnostic/`). n8n **no** dirige el cuestionario: solo recibe el
paquete final. Un único webhook recibe dos tipos de evento.

- **Configuración:** variable `VITE_N8N_WEBHOOK_URL` (en Vercel o `.env`).
  Sin ella, la página funciona en modo demo (no envía nada a la red).
- El webhook debe responder **de inmediato** (modo "Respond immediately"
  en n8n): la página espera el 200 para mostrar la pantalla de éxito;
  el procesamiento (Sheets, HubSpot, correo) sigue en segundo plano.

## Evento `lead` — al enviar el formulario

```json
{
  "type": "lead",
  "sessionId": "web-1721430000000-a1b2c3",
  "source": "sitio-web",
  "enviado_en": "2026-07-19T20:00:00.000Z",
  "meta": { "startedAt": "…", "source": "sitio-web", "userAgent": "…" },
  "lead": {
    "name": "Nombre",
    "clinic": "Clínica X",
    "whatsapp": "4421234567",
    "email": "correo@ejemplo.com",
    "consent": true
  },
  "resultado": {
    "etapas": {
      "captacion":    { "color": "verde|amarillo|rojo|gris", "conclusion": "…" },
      "respuesta":    { "color": "…", "conclusion": "…" },
      "agenda":       { "color": "…", "conclusion": "…" },
      "asistencia":   { "color": "…", "conclusion": "…" },
      "conversion":   { "color": "…", "conclusion": "…" },
      "recuperacion": { "color": "…", "conclusion": "…" }
    },
    "impacto": {
      "modo": "pesos | volumen | insuficiente",
      "dinero_min": 17000, "dinero_max": 180000,
      "volumen_min": 8, "volumen_max": 14,
      "etiqueta": "…",
      "palancas_usadas": ["A", "B", "C"],
      "supuestos_aplicados": ["RECOVERY=0.2-0.4", "VALORACION_RATE=0.7"],
      "desglose": [
        {
          "id": "A",
          "nombre": "Palanca A · …",
          "formula": "…",
          "datos": [{ "etiqueta": "Q3 · …", "respuesta": "…", "valor": "…" }],
          "calculo_bajo": "Mínimo: …",
          "calculo_alto": "Máximo: …"
        }
      ],
      "nota_total": "…",
      "notas": ["…"]
    },
    "meta": {
      "tipo_clinica": "…",
      "infraestructura": "…",
      "objetivo_90d": ["…"],
      "respuestas_crudas": { "q1-tipo": { "tipo": "…" }, "…": {} }
    }
  }
}
```

`dinero_*` solo existe en modo `pesos`; `volumen_*` solo en modo `volumen`.
`respuestas_crudas` trae las 19 respuestas literales, indexadas por el id
de cada pregunta (`q1-tipo` … `q19-prioridad`).

## Evento `meeting` — botón "Solicitar reunión con Carlos"

```json
{
  "type": "meeting",
  "sessionId": "web-…",
  "source": "sitio-web",
  "enviado_en": "…",
  "lead": { "name": "…", "clinic": "…", "whatsapp": "…", "email": "…", "consent": true }
}
```

`lead` puede ser `null` si la sesión se restauró tras recargar la página.

## Workflow receptor ("ALSAI · Diagnóstico web")

Reparte cada evento en paralelo:

1. **Google Sheets** — fila cruda por lead (bitácora completa, incluye el JSON).
2. **HubSpot** — upsert de contacto + nota con el diagnóstico legible.
3. **Gmail** — notificación inmediata a Carlos (lead nuevo / solicitud de reunión).

El agente de WhatsApp (Paso 2) se conectará a este mismo webhook,
sin tocar la página.

## Manejo de errores en la UI

- Error o `!res.ok` en `lead` → el formulario se conserva y muestra el error inline.
- Error en `meeting` → el botón vuelve a su estado inicial con aviso.
- Las preguntas nunca tocan la red: no pueden fallar por conexión.

## Estado actual (2026-07-20)

Workflow **publicado y activo** en n8n:

- **URL de producción:** `https://primary-production-48856.up.railway.app/webhook/diagnostico-alsai`
- Workflow: "ALSAI · Diagnóstico web" (id `6ZVfaoWLxo7JSiGZ`)
- Hoja de bitácora: "ALSAI · Leads Diagnóstico"
  (`1s1t3tUT6hDGCFmgw7A7Whv3uf3wld_DiSwyBZgBfgUI`, pestaña `Leads`)

Probado de punta a punta con leads de prueba:

| Nodo | Estado |
|---|---|
| Webhook → Switch → Preparar lead | ✅ |
| Guardar en Sheets | ✅ fila escrita con todas las columnas |
| Contacto en HubSpot | ✅ contacto creado (verificado en el CRM) |
| Tarea diagnóstico en HubSpot | ✅ tarea asociada, con el diagnóstico en el cuerpo |
| Aviso de lead a Carlos (Gmail) | ⚠️ ver aviso de credenciales |

Todos los nodos de destino tienen `onError: continueRegularOutput`:
el fallo de un destino no tumba a los demás ni pierde el lead.

## ⚠️ Aviso: credenciales de Gmail

Existen **dos** credenciales de Gmail en n8n. La antigua ("Gmail CEAS")
tiene el token revocado. Al guardar el workflow **desde la API**, n8n
reasigna automáticamente por tipo y vuelve a elegir la rota, deshaciendo
la asignación hecha a mano en la interfaz.

**Fix durable:** borrar (o reconectar) la credencial "Gmail CEAS" para que
solo quede una válida. Mientras existan las dos, después de cada edición
del workflow por API hay que reasignar Gmail a mano en los dos nodos de
correo y volver a publicar.

## Checklist para activar producción

1. **Gmail:** asignar la credencial de ALSAI en los dos nodos de correo
   y publicar. Idealmente, eliminar la credencial "Gmail CEAS".
2. `VITE_N8N_WEBHOOK_URL=https://primary-production-48856.up.railway.app/webhook/diagnostico-alsai`
   en Vercel → redeploy.
3. Prueba el flujo completo desde un teléfono (el modo demo desaparece solo).
