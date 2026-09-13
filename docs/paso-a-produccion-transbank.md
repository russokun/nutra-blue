# Guía de Paso a Producción: Transbank Webpay Plus

Procedimiento operativo para recibir la API Key de Transbank, configurar el entorno de producción y ejecutar la primera compra real de validación en **NutraBlue**.

---

## 1. Qué esperar tras enviar el Formulario de Validación

1. **Recepción por Transbank:**
   Al enviar el [Formulario de Validación](file:///d:/Work/nutra-blue/docs/transbank-formulario-validacion.md) a `soporte@transbank.cl` (o al ejecutivo asignado), el equipo de integraciones de Transbank revisa que las URLs sean válidas, que el sitio cuente con SSL y que las pruebas en integración se hayan registrado.
2. **Entrega de Credenciales:**
   Una vez aprobado, Transbank enviará un correo formal con:
   - **Código de Comercio de Producción:** 12 dígitos (ej: `597012345678`).
   - **API Key Secreta de Producción:** Cadena alfanumérica secreta que identifica a NutraBlue ante los servidores de producción de Transbank.

> [!IMPORTANT]
> **La API Key es un secreto de seguridad.** Nunca debe subirse a Git, repositorios públicos ni compartirse en chats abiertos. Se configura exclusivamente en las variables de entorno del servidor.

---

## 2. Configuración en el Servidor de Producción

En la plataforma donde corre la API de backend (Vercel, Railway, Render o VPS), actualizar las siguientes variables de entorno:

| Variable | Valor en Producción | Explicación |
|---|---|---|
| `WEBPAY_COMMERCE_CODE` | `5970XXXXXXXX` | El código de 12 dígitos de producción entregado por Transbank. |
| `WEBPAY_API_KEY` | *(API Key de Producción)* | La llave secreta de producción entregada por Transbank. |
| `PAYMENT_PROVIDER` | `transbank` | Activa Transbank Webpay Plus como pasarela predeterminada. |
| `ENVIRONMENT` | `production` | Modo producción activo. El backend verifica automáticamente que las credenciales sean válidas. |
| `PUBLIC_API_URL` | `https://api.nutrablue.cl` | URL pública donde Transbank envía el retorno del pago. |
| `PUBLIC_WEB_URL` | `https://nutrablue.cl` | URL de la tienda para redirigir al cliente tras el pago. |

> [!NOTE]
> La aplicación cuenta con un **guard de seguridad estricto**: si `ENVIRONMENT=production` y `WEBPAY_COMMERCE_CODE` está vacío o sigue con el valor de prueba (`597055555532`), el backend levantará un error de configuración impidiendo iniciar pagos ficticios en producción.

---

## 3. Realizar la Primera Compra de Prueba Real ($1.000)

Al igual que en Mercado Pago, Transbank no permite transacciones de $0. Se utiliza el mecanismo de **producto oculto de $1.000** ya implementado en NutraBlue:

1. **Verificar el Producto Oculto:**
   - En el panel de administración (`https://nutrablue.cl/admin`), ir a **Productos**.
   - Asegurarse de tener un producto con precio **$1.000**, stock disponible y la casilla **«Ocultar del catálogo»** marcada.
2. **Activar Modo Prueba en el Navegador:**
   - Abrir en el navegador:
     ```text
     https://nutrablue.cl/shop?prueba=1
     ```
   - Aparecerá la barra superior naranja indicando modo prueba.
3. **Ejecutar el Checkout con Webpay:**
   - Agregar el producto de prueba al carrito e ir a `/checkout`.
   - Seleccionar **Webpay Plus (Transbank)**.
   - Al presionar *Confirmar y Pagar*, el sistema redirigirá al portal seguro de Webpay (`webpay3g.transbank.cl` en producción).
   - Pagar con una tarjeta de débito (Redcompra) o crédito real de $1.000.
4. **Verificar la Pantalla de Éxito (Voucher Webpay):**
   - Transbank redirige a `https://nutrablue.cl/order-confirmation/{order_id}`.
   - Debe desplegarse el recuadro verde de **Voucher Oficial de Webpay Plus**:
     - Comercio: Nutra Blue
     - Orden de Compra
     - Código de Autorización real emitido por Transbank
     - Fecha, hora y monto total ($1.000)
     - Botón de imprimir comprobante

---

## 4. Qué verificar en el Sistema y en Transbank

### En el Panel de Administración de NutraBlue
En **Pedidos → Ver detalle del pedido**:
- **Estado:** `paid`
- **Pasarela:** `transbank`
- **ID de Pago:** Código de autorización de Transbank (ej: `123456`)
- **Modo Prueba (`is_test`):** `false` (indica que fue procesado con credenciales reales de producción)
- **Stock:** Descontado en 1 unidad automáticamente.

### En el Portal de Clientes de Transbank
1. Ingresar a [portalclientes.transbank.cl](https://portalclientes.transbank.cl) con el RUT y clave de NutraBlue.
2. Ir a **Ventas y Transacciones** → **Movimientos del Día**.
3. Confirmar que figure la transacción de $1.000 con estado **Aceptada / Liquidada**.

---

## 5. Plan de Contingencia / Rollback Inmediato

Si en cualquier momento se requiere volver a Mercado Pago o cambiar de pasarela sin interrumpir las ventas de la tienda:

1. Modificar la variable de entorno en el servidor:
   ```env
   PAYMENT_PROVIDER=mercadopago
   ```
2. Reiniciar el servicio de API.
3. El sistema volverá inmediatamente a cobrar mediante Mercado Pago sin necesidad de alterar el frontend ni redeployar la aplicación.
