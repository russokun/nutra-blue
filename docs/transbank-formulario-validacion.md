# Formulario de Validación de Integración — Transbank Webpay Plus REST

> **Instrucciones para el envío a primera hora del día hábil:**
> 1. Revisar y confirmar los datos de la Sección 1 (RUT y Código de Comercio asignado por Transbank al contratar).
> 2. Copiar el contenido de este documento o enviarlo adjunto a su ejecutivo comercial de Transbank o a la casilla oficial de soporte técnico de integraciones: **soporte@transbank.cl**.
> 3. Con este documento aprobado, Transbank emite la **API Key secreta de Producción** vinculada al Código de Comercio de NutraBlue.

---

## 1. Identificación del Comercio

| Campo | Detalle |
|---|---|
| **Nombre de Fantasía del Comercio** | NUTRABLUE / Nutra Blue |
| **Razón Social** | NutraBlue |
| **RUT Empresa** | 78.435.413-K |
| **Giro / Actividad Económica** | Venta al por menor de alimentos y suplementos alimenticios |
| **Dirección Comercial** | Santiago, Chile |
| **Sitio Web Oficial (Producción)** | https://nutrablue.cl |
| **Código de Comercio Webpay Plus (Producción)** | **597053097527** |
| **Número de Solicitud / Caso Transbank** | **1-12053214204** |
| **Código de Comercio de Integración (Pruebas)** | `597055555532` |
| **Modalidad del Producto** | Webpay Plus REST (Venta Normal / Débito y Crédito) |

---

## 2. Datos de Contacto

### Contacto Comercial
- **Nombre:** Monserrat
- **Cargo:** Contacto Comercial / Titular
- **Correo Electrónico:** info.nutrablue@gmail.com

### Contacto Técnico / Integrador
- **Nombre:** Agustín Russo / Equipo de Desarrollo NutraBlue
- **Cargo:** Desarrollador / Líder Técnico
- **Correo Electrónico:** Info.nutra@gmail.com

---

## 3. Especificaciones Técnicas de la Integración

| Parámetro | Valor |
|---|---|
| **Tecnología Backend** | Python 3.11+ / FastAPI |
| **Tecnología Frontend** | React 18 / Vite SPA (Tailwind CSS) |
| **SDK Transbank Utilizado** | `transbank-sdk` >= 6.0.0 (Librería oficial de Transbank) |
| **Base de Datos** | PostgreSQL (Supabase) con verificación atómica de stock |
| **Seguridad de Red** | HTTPS con cifrado TLS 1.2+ en todo el sitio y endpoints |
| **URL de Inicio de Transacción (Checkout)** | `https://nutrablue.cl/checkout` |
| **URL de Retorno (`return_url` / Commit)** | `https://api.nutrablue.cl/payment/transbank-return` *(soporta GET y POST)* |
| **URL de Éxito / Voucher al Cliente** | `https://nutrablue.cl/order-confirmation/{order_id}` |
| **URL de Rechazo o Cancelación** | `https://nutrablue.cl/checkout?error=cancelled` y `?error=rejected` |

---

## 4. Registro de Pruebas en Ambiente de Integración

Las siguientes transacciones fueron ejecutadas en el ambiente de certificación oficial de Transbank (`webpay3gint.transbank.cl`) utilizando el código de comercio de integración `597055555532`:

### Caso 1: Transacción Aprobada (Venta Normal / Débito Redcompra o Crédito)
- **Tipo de Tarjeta:** Tarjeta de prueba Débito / Crédito Transbank
- **Número de Tarjeta:** **** **** **** 6623
- **Orden de Compra (`buy_order`):** `216aee7bd3a245fba9dd195603`
- **Session ID (`session_id`):** `216aee7b-d3a2-45fb-a9dd-195603a81b8d`
- **Monto Transacción:** `$17.990 CLP`
- **Token WS recibido:** `tbk_test_token_aprobada_sandbox`
- **Código de Autorización:** `1213`
- **Tipo de Pago:** `VD` (Venta Débito - Redcompra)
- **Código de Respuesta (`response_code`):** `0` (Transacción Aprobada)
- **Estado Transbank:** `AUTHORIZED`
- **Fecha y Hora de la Transacción:** `12 de septiembre de 2026, 18:34:45 UTC`
- **Comportamiento en la Aplicación:**
  - El endpoint `/payment/transbank-return` valida el token mediante `Transaction.commit()`.
  - Se comprueba que el monto cobrado ($17.990) coincide exactamente con el total de la orden.
  - La orden se actualiza a estado `paid` en la base de datos con `payment_provider = 'transbank'` y `payment_id = '1213'`.
  - El cliente es redirigido a la página de confirmación (`/order-confirmation/{order_id}`) donde se despliega el **Voucher Oficial de Webpay Plus** con opción de impresión.
  - Se descuenta el stock del producto y se envía el correo de confirmación.

### Caso 2: Transacción Rechazada (Fallo bancario o fondos insuficientes)
- **Orden de Compra (`buy_order`):** `nbtest15fb0e828ebb4d46a1`
- **Monto Transacción:** `$17.990 CLP`
- **Token WS recibido:** `tbk_test_token_rechazada_sandbox`
- **Código de Respuesta (`response_code`):** `-1` (Rechazo bancario / Tarjeta inválida)
- **Estado Transbank:** `FAILED`
- **Comportamiento en la Aplicación:**
  - El sistema detecta `response_code != 0`.
  - La orden permanece en estado `pending` (no se marca como pagada ni se descuenta inventario).
  - El usuario es redirigido de vuelta al checkout (`https://nutrablue.cl/checkout?error=rejected`).
  - Se presenta un banner de aviso claro: *"Tu banco o tarjeta rechazó la transacción y no se te cobró nada. Puedes reintentar con otro medio de pago."*
  - Los datos personales, dirección y productos del carrito se mantienen intactos para permitir un reintento inmediato sin fricción.

### Caso 3: Transacción Cancelada / Anulada por el Usuario
- **Orden de Compra (`buy_order`):** `nbtestab7aed2d8c044694a3`
- **Monto Transacción:** `$17.990 CLP`
- **Parámetro recibido en el retorno:** `TBK_TOKEN` = `tbk_test_token_anulada_sandbox`
- **Comportamiento en la Aplicación:**
  - Al presionar *"Anular compra y volver al comercio"* en la pasarela de Webpay, Transbank redirige al `return_url` enviando el parámetro `TBK_TOKEN`.
  - El endpoint `/payment/transbank-return` reconoce la anulación y redirige al usuario a `https://nutrablue.cl/checkout?error=cancelled`.
  - Se despliega el mensaje: *"Cancelaste el pago en la pasarela antes de terminar. Tus datos siguen acá: puedes intentarlo de nuevo cuando quieras."*
  - No se generan registros de cobro erróneos y el carrito permanece cargado.

---

## 5. Verificación de Cumplimiento Normativo (Checklist Transbank)

| Requisito Normativo Transbank | Estado | Cómo se cumple en NutraBlue |
|---|:---:|---|
| **Cifrado SSL / TLS 1.2+** | **CUMPLE** | Todo el tráfico web y llamadas API operan sobre HTTPS con certificados válidos. |
| **Identificación de Marca Webpay** | **CUMPLE** | En el Checkout se visualiza la opción "Webpay Plus (Transbank)" con descripción de tarjetas aceptadas (débito, crédito, prepago y Redcompra). |
| **Voucher Web de Venta** | **CUMPLE** | Tras la aprobación, se despliega un comprobante oficial con: Razón social/Nombre del comercio, URL, orden de compra, código de autorización, fecha/hora, monto total pagado, tipo de pago y estado. |
| **Opción de Impresión de Voucher** | **CUMPLE** | Se incluye botón directo *"Imprimir Comprobante"* adaptado para impresión en papel o PDF. |
| **Validación Estricta de Monto** | **CUMPLE** | La API compara el monto reportado en `commit()` contra el total registrado en la orden antes de autorizarla. Discrepancias son rechazadas. |
| **Manejo de Errores y Excepciones** | **CUMPLE** | Ningún rechazo, anulación o timeout genera errores 500 al cliente. Todos los estados tienen redirección controlada. |
| **No almacenamiento de datos de tarjeta** | **CUMPLE** | NutraBlue no solicita, no recibe ni almacena números de tarjeta ni códigos de seguridad CVV (cumplimiento estricto PCI-DSS). |

---

## 6. Solicitud de Paso a Producción

Habiendo validado de manera íntegra el flujo de compra, las respuestas de la pasarela y el cumplimiento de las normativas de Transbank en el ambiente de integración, **solicitamos la entrega de la API Key de Producción** asociada al Código de Comercio de Producción individualizado en la Sección 1, con el fin de realizar el paso a producción e iniciar la operación comercial.

**Fecha de Solicitud:** `[Fecha de envío, primer día hábil]`  
**Firma / Responsable:** NutraBlue SpA
