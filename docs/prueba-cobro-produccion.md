# Validar el cobro real en producción

Procedimiento para comprobar, antes de abrir la tienda, que la plata llega a la cuenta
de NutraBlue y que Mercado Pago emite el comprobante que corresponde.

No se puede probar con costo $0: **Mercado Pago rechaza las preferencias de monto cero.**
Por eso se usa un producto oculto de $1.000.

---

## 1. Antes de empezar: revisar la configuración de producción

| Variable | Valor esperado | Por qué importa |
|---|---|---|
| `MERCADOPAGO_ACCESS_TOKEN_PROD` | Empieza con `APP_USR-`, de la cuenta de NutraBlue | Un token `TEST-` cobra plata de mentira. El entorno lo define el token, no una bandera. |
| `MERCADOPAGO_WEBHOOK_SECRET_PROD` | El secreto del panel de Mercado Pago | **La API ya no arranca el webhook sin esto en producción.** Sin secreto, cualquiera puede marcar órdenes como pagadas. |
| `PAYMENT_PROVIDER_PROD` | `mercadopago` | Con otro valor no se cobra. |
| `PUBLIC_API_URL_PROD` | `https://api.nutrablue.cl` | Es la URL que se le manda a Mercado Pago para notificar el pago. |
| `PUBLIC_WEB_URL_PROD` | `https://nutrablue.cl` | A dónde vuelve el comprador después de pagar. |
| `INTERNAL_API_KEY` | Un valor propio | El código trae un valor por defecto que está en el repositorio. |

En el panel de Mercado Pago, la URL de notificaciones tiene que ser
`https://api.nutrablue.cl/payment/mercadopago-callback`.

> Ojo: la API aplica un límite de 120 solicitudes por minuto por IP, y ese límite también
> cubre el webhook. En un pico de ventas alto habría que revisarlo.

## 2. Crear el producto de prueba

Desde el panel de administración, crear un producto con:

- Precio: **$1.000**
- Stock: **5**
- Marcado como **oculto**

Un producto oculto no aparece en el catálogo, ni en el carrusel del inicio, ni en los
filtros: solo se llega por la URL directa `https://nutrablue.cl/product/<id>`. Y queda
exento del barrido que borra los productos que no están en la planilla, así que la
sincronización no lo elimina.

## 3. Hacer la compra

1. Abrir la URL directa del producto de prueba.
2. Completar el checkout con datos reales y pagar con una tarjeta propia.
3. Confirmar que la redirección vuelve a la página de confirmación del pedido.

## 4. Qué verificar después

**En la base de datos**, la orden tiene que quedar con:

- `status` = `paid`
- `paid_at` con la fecha y hora del pago
- `payment_provider` = `mercadopago`
- `payment_id` con el identificador de Mercado Pago
- `is_test` = `false` (es una compra real; `true` significaría credenciales de prueba)
- el stock del producto descontado en 1

Todo esto se ve en el panel de administración, en **Pedidos → Ver**.

**En el correo**: tiene que llegar la confirmación de compra y la de pago.

**En el panel de Mercado Pago de NutraBlue**: revisar el movimiento, la comisión
descontada, la fecha de liquidación y —esto es lo que el cliente quiere ver— **el
comprobante que Mercado Pago genera por la venta**.

## 5. Deshacer

Reembolsar la compra desde el panel de Mercado Pago y confirmar que llega la
notificación del reembolso.

> El reembolso **no** revierte automáticamente el estado de la orden ni repone el stock:
> hoy no hay manejo de reembolsos en la aplicación. Hay que cancelar la orden a mano
> desde el panel (cancelarla repone el stock solo si sigue en `pending`, así que en una
> orden ya pagada el stock se ajusta a mano).

---

## Lo que la aplicación NO hace: boletas y SII

**La aplicación no emite documentos tributarios, y no debería.**

El comprobante que entrega Mercado Pago es un comprobante de la transacción: **no es una
boleta electrónica del SII**. Para que la venta quede tributariamente correcta, NutraBlue
tiene que resolver por su lado, con su contador:

1. Tener inicio de actividades con un giro compatible con la venta de alimentos y
   suplementos.
2. Habilitar la emisión de boleta electrónica. Hay tres caminos: el facturador gratuito
   del SII, un proveedor externo de facturación, o la funcionalidad de facturación de
   Mercado Pago si el plan contratado la incluye.
3. Definir **quién emite la boleta**: si la emite Mercado Pago o si la emite NutraBlue
   por su cuenta a partir de los movimientos.
4. Tener presente que la comisión de Mercado Pago es un gasto con su propia factura,
   separada de la venta.

Si más adelante quieren que la boleta salga automáticamente con cada venta, eso es una
integración con un facturador electrónico: es un desarrollo aparte, hay que cotizarlo
como tal y no está incluido en lo hecho hasta acá.
