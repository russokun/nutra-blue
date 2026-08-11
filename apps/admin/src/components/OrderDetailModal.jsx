import React, { useState, useEffect } from 'react';
import adminClient from '@/lib/adminClient';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { X, MapPin, Truck, CreditCard, Package, Mail, Phone, MessageCircle } from 'lucide-react';

const formatPrice = (price) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price || 0);

const COURIER_LABELS = {
  blue_express: 'Blue Express',
  starken: 'Starken',
  pullman: 'Pullman',
};

const formatDelivery = (order) => {
  if (order.delivery_method === 'retiro_vendedor') return 'Retiro con vendedor';
  if (order.delivery_method === 'retiro_courier') {
    return `Retiro en sucursal · ${COURIER_LABELS[order.courier] || 'transporte por definir'}`;
  }
  return 'Envío a domicilio';
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

/**
 * Enlace de WhatsApp con el mensaje de seguimiento ya escrito.
 *
 * A proposito no hay integracion con la API de WhatsApp: wa.me abre el chat con el
 * texto precargado y NutraBlue lo envia desde su propio numero. Cero credenciales,
 * cero costo por mensaje.
 */
const armarEnlaceWhatsApp = (order) => {
  const telefono = (order?.phone || '').replace(/[^\d]/g, '');
  if (!telefono) return null;

  const codigo = order.tracking_code;
  const empresa = COURIER_LABELS[order.shipping_company] || COURIER_LABELS[order.courier];
  const idCorto = String(order.id || '').slice(0, 8).toUpperCase();

  const mensaje = codigo
    ? `Hola ${order.customer_name || ''}, tu pedido #${idCorto} de NutraBlue ya va en camino con ${empresa || 'el courier'}. Tu código de seguimiento es ${codigo}.`
    : `Hola ${order.customer_name || ''}, te escribimos de NutraBlue por tu pedido #${idCorto}.`;

  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
};

const Campo = ({ label, children }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
    <dd className="text-sm text-foreground break-words">{children || '—'}</dd>
  </div>
);

const Seccion = ({ icon: Icon, titulo, children }) => (
  <section className="rounded-xl border border-border/60 p-4">
    <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
      <Icon className="h-4 w-4 text-muted-foreground" /> {titulo}
    </h4>
    {children}
  </section>
);

/**
 * Detalle completo de un pedido. La lista solo muestra 7 columnas y descarta los
 * items, el contacto, la direccion y el rastro del pago, que es justo lo que hace
 * falta para preparar un despacho o resolver un reclamo.
 */
const OrderDetailModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    let cancelado = false;

    (async () => {
      try {
        setLoading(true);
        const data = await adminClient.getOrder(orderId);
        if (!cancelado) setOrder(data);
      } catch (err) {
        if (!cancelado) {
          toast.error(err.message || 'No se pudo cargar el pedido');
          onClose();
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => { cancelado = true; };
  }, [orderId, onClose]);

  useEffect(() => {
    const alCerrarConEscape = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alCerrarConEscape);
    return () => window.removeEventListener('keydown', alCerrarConEscape);
  }, [onClose]);

  if (!orderId) return null;

  const items = order?.items || [];
  const direccion = [order?.address, order?.city, order?.region].filter(Boolean).join(', ');
  const enlaceWhatsApp = order ? armarEnlaceWhatsApp(order) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-3xl p-6 shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del pedido"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3 rounded-lg" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : !order ? null : (
          <>
            <header className="mb-6 pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Pedido</h3>
                <span className="font-mono text-xs text-primary font-bold">{order.id}</span>
                {order.is_test && (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                    Prueba
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Creado el {formatDate(order.created_at)}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Seccion icon={Mail} titulo="Cliente">
                <dl className="space-y-2">
                  <Campo label="Nombre">{order.customer_name}</Campo>
                  <Campo label="Email">
                    <a href={`mailto:${order.email}`} className="text-primary hover:underline">{order.email}</a>
                  </Campo>
                  <Campo label="Teléfono">
                    <a href={`tel:${order.phone}`} className="text-primary hover:underline inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {order.phone}
                    </a>
                  </Campo>
                </dl>
              </Seccion>

              <Seccion icon={MapPin} titulo="Entrega">
                <dl className="space-y-2">
                  <Campo label="Método">
                    <span className="inline-flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" /> {formatDelivery(order)}
                    </span>
                  </Campo>
                  <Campo label="Dirección">{direccion}</Campo>
                </dl>
              </Seccion>
            </div>

            <Seccion icon={Package} titulo={`Productos (${items.length})`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/60">
                    <tr>
                      <th className="pb-2">Producto</th>
                      <th className="pb-2 text-center">Cant.</th>
                      <th className="pb-2 text-right">Precio</th>
                      <th className="pb-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={`${item.product_id}-${i}`} className="border-b border-border/40 last:border-0">
                        <td className="py-2 pr-2">
                          <div className="font-medium text-foreground">{item.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{item.product_id}</div>
                        </td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">{formatPrice(item.price)}</td>
                        <td className="py-2 text-right font-semibold">{formatPrice(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <dl className="mt-4 space-y-1.5 border-t border-border/60 pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal (neto)</span><span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>IVA (19%)</span><span>{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Envío</span>
                  <span>{order.shipping_cost ? formatPrice(order.shipping_cost) : 'Gratis'}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground text-base pt-1.5 border-t border-border/60">
                  <span>Total</span><span>{formatPrice(order.total)}</span>
                </div>
              </dl>
            </Seccion>

            <div className="mt-4">
              <Seccion icon={Truck} titulo="Seguimiento del envío">
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Campo label="Código de seguimiento">
                    <span className="font-mono text-sm font-bold text-primary">{order.tracking_code}</span>
                  </Campo>
                  <Campo label="Empresa">{COURIER_LABELS[order.shipping_company] || null}</Campo>
                  <Campo label="Despachado el">{order.shipped_at ? formatDate(order.shipped_at) : null}</Campo>
                  <Campo label="Flete">
                    {order.shipping_payment === 'pagado' ? 'Pagado' : 'Por pagar'}
                  </Campo>
                </dl>

                {!order.tracking_code && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Todavía no se registra el despacho. Puedes hacerlo desde «Registrar Despacho» en el panel principal.
                  </p>
                )}

                {enlaceWhatsApp && (
                  <a
                    href={enlaceWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Avisar por WhatsApp
                  </a>
                )}
              </Seccion>
            </div>

            <div className="mt-4">
              <Seccion icon={CreditCard} titulo="Pago">
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Campo label="Estado">
                    <span className="font-semibold uppercase">{order.status}</span>
                  </Campo>
                  <Campo label="Pasarela">{order.payment_provider}</Campo>
                  <Campo label="ID de pago">
                    <span className="font-mono text-xs">{order.payment_id}</span>
                  </Campo>
                  <Campo label="Pagado el">{order.paid_at ? formatDate(order.paid_at) : null}</Campo>
                </dl>
              </Seccion>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={onClose} variant="outline" className="rounded-xl">Cerrar</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetailModal;
