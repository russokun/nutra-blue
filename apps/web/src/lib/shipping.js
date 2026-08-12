/**
 * Política de despacho de NutraBlue.
 *
 * La tienda NUNCA cobra el flete: `shipping_cost` siempre viaja en 0 y el total que se
 * paga por Mercado Pago es solo el de los productos. El flete se resuelve por fuera de
 * la app, y este umbral define QUIÉN lo paga:
 *
 *   - Pedidos sobre $50.000  -> lo asume NutraBlue. Para el cliente es envío gratis.
 *   - Pedidos bajo $50.000   -> el pedido viaja "por pagar": el cliente le paga al
 *                               courier al recibir o retirar, y NutraBlue lo coordina.
 *
 * Vive acá y no repartido por las páginas porque antes el monto estaba escrito a mano en
 * cinco lugares y se contradecían entre sí.
 */
export const FREE_SHIPPING_THRESHOLD = 50000;

export const isFreeShipping = (cartTotal) => Number(cartTotal) >= FREE_SHIPPING_THRESHOLD;

export const formatThreshold = () =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(FREE_SHIPPING_THRESHOLD);

/** Texto corto para el resumen del pedido. */
export const shippingLabel = (cartTotal) =>
  isFreeShipping(cartTotal) ? 'Gratis' : 'Por pagar';

/** Explicación de una línea, para mostrar bajo el resumen. */
export const shippingHint = (cartTotal) =>
  isFreeShipping(cartTotal)
    ? 'Tu pedido supera los ' + formatThreshold() + ': el despacho corre por nuestra cuenta.'
    : 'El despacho se paga al recibir o retirar. Sobre ' + formatThreshold() + ' lo asumimos nosotros.';
