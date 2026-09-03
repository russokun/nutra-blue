# Flujo n8n: Suscriptores, Descuento y Sincronización de Catálogo

Este documento describe la arquitectura y configuración de las automatizaciones de NutraBlue en n8n:
1. **Flujo de Suscriptores & Descuento de Bienvenida** (`n8n_subscriber_flow.json`)
2. **Sincronización Automática del Catálogo** desde Google Sheets

---

## 1. Flujo de Suscriptores (Leads)

### Origen de los datos
Los leads se generan en la tienda web desde dos puntos de contacto:
- **Pop-up Magnet del Home (`HomePage.jsx`)**: Se activa tras 4 segundos de visita o al detectar intención de salida.
- **Formulario de Suscripción en el Footer (`Footer.jsx`)**: Disponible permanentemente en la parte inferior de todas las páginas.

Ambos formularios envían los datos al endpoint de la API:
`POST /subscribers` (o `/hcgi/api/subscribers` vía proxy)
```json
{
  "email": "usuario@ejemplo.com",
  "source": "Pop-up Magnet"
}
```

### Procesamiento en la API
1. **Base de Datos (Supabase)**: Registra o actualiza el lead en la tabla `public.leads` con `email` y `source`.
2. **Email de Bienvenida (Resend)**: Envía de inmediato el correo con el código de descuento (`WELCOME15` de 15% de descuento, ajustable según lo que defina NutraBlue).
3. **Webhook a n8n**: Si la variable `N8N_SUBSCRIBER_WEBHOOK` está configurada en la API, realiza un `POST` con `{ email, source }`.

### Nodos en n8n (`n8n_subscriber_flow.json`)
1. **Webhook Trigger (API Nutra Blue)**:
   - Ruta: `POST /new-subscriber`
   - Recibe: `body.email`, `body.source`
2. **Enviar Email (Resend API)** (Opcional si se gestiona desde n8n en vez de la API):
   - Envía el correo de bienvenida con diseño de marca NutraBlue y el cupón de descuento.
3. **Registrar Lead en Google Sheets**:
   - Agrega fila con columnas: `Email`, `Origen`, `Fecha`.
   - Document ID: `1eXHHOAxlc-z9EmsCsbcXklPfY0DePr6UPiFA0kbc-QU` (Planilla de Leads de NutraBlue).

---

## 2. Sincronización de Catálogo

La sincronización del catálogo lee directamente la planilla Google Sheet de productos y deriva las taxonomías de categoría, beneficio y tipo (descrito en `docs/planilla-taxonomia.md`).

### Cómo disparar la sincronización:
- **Desde el Panel de Administración**: Botón *"Sincronizar Catálogo"* en la sección de Productos (`/admin/products/sync-sheets?background=true`).
- **Desde n8n (Cron programado o Webhook)**:
  - Método: `POST /admin/products/sync-sheets`
  - Encabezado: `X-Internal-Key: <INTERNAL_API_KEY>` (o autenticación admin)
  - Modo síncrono: devuelve el reporte completo de filas actualizadas, creadas y advertencias.
