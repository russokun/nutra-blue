/**
 * Política de despacho de NutraBlue.
 *
 * La tienda NUNCA cobra el flete: `shipping_cost` siempre viaja en 0 y el total que se
 * paga por Mercado Pago es solo el de los productos. El flete se resuelve por fuera de
 * la app, y esta política define QUIÉN lo paga:
 *
 *   - Pedidos dentro de la Región Metropolitana y sobre $50.000 -> lo asume NutraBlue.
 *     Para el cliente es envío gratis.
 *   - Cualquier otro caso (bajo $50.000 en la RM, o fuera de la RM sin importar el
 *     monto) -> el pedido viaja "por pagar": el cliente le paga al courier al recibir
 *     o retirar, y NutraBlue lo coordina.
 *
 * Vive acá y no repartido por las páginas porque antes el monto estaba escrito a mano en
 * cinco lugares y se contradecían entre sí.
 */
export const FREE_SHIPPING_THRESHOLD = 50000;
export const FREE_SHIPPING_REGION = 'Metropolitana';

export const isFreeShipping = (cartTotal, region) =>
  region === FREE_SHIPPING_REGION && Number(cartTotal) >= FREE_SHIPPING_THRESHOLD;

export const formatThreshold = () =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(FREE_SHIPPING_THRESHOLD);

/** Texto corto para el resumen del pedido. */
export const shippingLabel = (cartTotal, region) =>
  isFreeShipping(cartTotal, region) ? 'Gratis' : 'Por pagar';

/** Explicación de una línea, para mostrar bajo el resumen. */
export const shippingHint = (cartTotal, region) => {
  if (isFreeShipping(cartTotal, region)) {
    return 'Tu pedido supera los ' + formatThreshold() + ': el despacho corre por nuestra cuenta.';
  }
  if (region && region !== FREE_SHIPPING_REGION) {
    return 'Fuera de la Región Metropolitana el despacho siempre se paga al recibir o retirar.';
  }
  return 'El despacho se paga al recibir o retirar. Sobre ' + formatThreshold() + ' lo asumimos nosotros (solo Región Metropolitana).';
};
