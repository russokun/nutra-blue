# Flujo de Suscriptores: Planilla de Leads, Descuento y Sincronización de Catálogo

Este documento describe las automatizaciones de NutraBlue:

1. **Leads de suscripción → Google Sheets + cupón de bienvenida**
2. **Sincronización automática del catálogo** desde Google Sheets

---

## 1. Leads de suscripción

### De dónde salen

La tienda captura leads en dos puntos, y los dos llaman al **mismo** endpoint:

| Punto de contacto | Archivo | `source` que envía |
|---|---|---|
| Pop-up del home (a los 4 s o al detectar intención de salida) | `apps/web/src/pages/HomePage.jsx` | `Pop-up Magnet` |
| Formulario del footer (en todas las páginas) | `apps/web/src/components/Footer.jsx` | `Footer Newsletter` |

```
POST /subscribers        (o /hcgi/api/subscribers vía el proxy de Vercel)
{ "email": "usuario@ejemplo.com", "source": "Pop-up Magnet" }
```

Respuesta:

```json
{ "success": true, "message": "...", "coupon_code": "WELCOME15", "discount": 15 }
```

> `POST /leads` también existe y dispara exactamente lo mismo, para que un lead que
> entre por ahí (integración externa, formulario antiguo) tampoco se quede sin cupón
> ni sin fila en la planilla.

### Qué hace la API con cada lead

`apps/api/app/routers/subscribers.py` lo replica en **cuatro destinos independientes**.
Si uno falla, los otros tres siguen: el visitante siempre recibe un 201.

| # | Destino | Requiere | Si no está configurado |
|---|---|---|---|
| 1 | Tabla `leads` de Supabase (lo que ve el panel) | `SUPABASE_URL` + `SUPABASE_KEY` | Se registra un warning y sigue |
| 2 | Email de bienvenida con el cupón (Resend) | `EMAIL_ENABLED=true` + `RESEND_API_KEY` | Se loguea "Email disabled" |
| 3 | **Planilla de Google Sheets** (Apps Script) | `GOOGLE_SHEETS_LEADS_WEBHOOK` | Se omite |
| 4 | Webhook de n8n (CRM, enriquecimiento) | `N8N_SUBSCRIBER_WEBHOOK` | Se omite |

Los destinos 3 y 4 reintentan hasta 3 veces con backoff (`app/services/leads_sheet.py`).
Si aun así fallan, el lead queda en Supabase y el error queda en el log con el correo,
para poder reprocesarlo a mano.

### Payload que reciben la planilla y n8n

```json
{
  "event": "new_lead_first_purchase",
  "email": "usuario@ejemplo.com",
  "source": "Pop-up Magnet",
  "date": "2026-09-19T22:06:36.471298+00:00",
  "coupon_code": "WELCOME15",
  "discount": 15,
  "description": "Bienvenida 15% off en primera compra",
  "token": "<solo si GOOGLE_SHEETS_LEADS_TOKEN está definido>"
}
```

---

## 2. Guardar los leads en Google Sheets

Hay **dos caminos** hacia la planilla y basta con uno. El camino A es el recomendado
porque no depende de que haya una instancia de n8n corriendo.

### Camino A (recomendado): Web App de Google Apps Script

El script vive en `apps/api/scripts/google_apps_script_leads.gs` y corre dentro de la
propia planilla, así que no hay credenciales de Google en el servidor.

1. Abrir la planilla de leads → **Extensiones > Apps Script**.
2. Pegar el contenido de `google_apps_script_leads.gs` y guardar.
3. **Configuración del proyecto > Propiedades del script**: agregar `LEADS_TOKEN`
   con un string aleatorio largo.
4. **Implementar > Nueva implementación > Aplicación web**:
   - Ejecutar como: *Yo*
   - Quién tiene acceso: *Cualquier persona*
5. Copiar la URL `/exec` y definir en el entorno de la API:

```
GOOGLE_SHEETS_LEADS_WEBHOOK=https://script.google.com/macros/s/AKf.../exec
GOOGLE_SHEETS_LEADS_TOKEN=<el mismo LEADS_TOKEN>
```

El script crea la hoja `Leads` con las columnas `Fecha | Email | Origen | Cupón |
Descuento` y **actualiza** la fila si el correo ya estaba, en vez de duplicarla.

Para comprobar que quedó publicado, abrir la URL `/exec` en el navegador: responde
`{"ok":true,"service":"nutrablue-leads"}`.

> Cada cambio al script necesita una implementación nueva (o actualizar la existente)
> para que la URL sirva la versión nueva.

### Camino B: n8n (`n8n_subscriber_flow.json`)

Importar el flujo en n8n y definir `N8N_SUBSCRIBER_WEBHOOK` con la URL del webhook.

Nodos:

1. **Webhook Trigger** — `POST /new-subscriber`, recibe el payload de arriba en `body`.
2. **Enviar Email (Resend API)** — **desactivado a propósito**: el email de bienvenida
   ya lo manda la API. Si se decide que n8n se haga cargo del correo, hay que activar
   este nodo *y* apagar `EMAIL_ENABLED` en la API, o el suscriptor recibe dos correos.
3. **Registrar Lead en Google Sheets** — agrega la fila con las mismas columnas que el
   Apps Script. Document ID: `1eXHHOAxlc-z9EmsCsbcXklPfY0DePr6UPiFA0kbc-QU`.

> Si se usan los dos caminos a la vez, ambos escriben en la misma planilla. El Apps
> Script actualiza por correo, pero el nodo de n8n hace *append*, así que conviene
> dejar **uno solo** apuntando a la hoja.

---

## 3. El cupón de bienvenida

El porcentaje lo define NutraBlue y sale de **un solo lugar**:

```
WELCOME_COUPON_CODE=WELCOME15
WELCOME_COUPON_DISCOUNT=15
```

Cambiar esas dos variables cambia, sin tocar código:

- el código y el porcentaje del email de bienvenida,
- el texto del pop-up del home y el toast del footer (vía `GET /welcome-coupon`),
- el `coupon_code` / `discount` que viajan a la planilla y a n8n,
- la validación del cupón en el checkout (`GET /coupons/validate/{code}`).

El cupón es de **primera compra**: si el correo ya tiene una orden pagada, el checkout
lo rechaza (`apps/api/app/services/coupons_service.py`).

> Al cambiar el código, el cupón anterior deja de estar en la lista por defecto. Si ya
> se repartió `WELCOME15` por email, conviene dejarlo vivo en la tabla `coupons` de
> Supabase para no romperle la compra a quien lo tenga.

---

## 4. Checklist de puesta en marcha

- [ ] `SUPABASE_URL` / `SUPABASE_KEY` configurados (tabla `leads` creada con
      `supabase/migrations/016_create_leads_table.sql`).
- [ ] `EMAIL_ENABLED=true` y `RESEND_API_KEY` con la key de producción.
- [ ] `PUBLIC_WEB_URL` apuntando a `https://nutrablue.cl` (es el link del botón del
      email de bienvenida).
- [ ] Apps Script desplegado y `GOOGLE_SHEETS_LEADS_WEBHOOK` + `GOOGLE_SHEETS_LEADS_TOKEN`
      definidos.
- [ ] `WELCOME_COUPON_DISCOUNT` con el porcentaje que definió NutraBlue.
- [ ] Prueba real: suscribirse desde el pop-up y desde el footer, y verificar que
      aparecen la fila en la planilla, el lead en el panel y el correo en la bandeja.

### Cómo verificar sin esperar a un cliente

```bash
curl -X POST https://api.nutrablue.cl/subscribers \
  -H "Content-Type: application/json" \
  -d '{"email":"prueba@nutrablue.cl","source":"Prueba manual"}'
```

Debe responder 201 con el cupón, aparecer una fila nueva en la planilla y llegar el
correo. Los leads de prueba se borran desde la planilla y desde la tabla `leads`.

---

## 5. Sincronización de Catálogo

La sincronización lee la planilla de productos y deriva las taxonomías de categoría,
beneficio y tipo (ver `docs/planilla-taxonomia.md`).

Cómo dispararla:

- **Panel de Administración**: botón *"Sincronizar Catálogo"* en Productos
  (`/admin/products/sync-sheets?background=true`).
- **n8n (cron o webhook)**: `POST /admin/products/sync-sheets` con el encabezado
  `X-Internal-API-Key: <INTERNAL_API_KEY>`. En modo síncrono devuelve el reporte
  completo de filas actualizadas, creadas y advertencias.
