import React, { useState, useEffect } from 'react';
import adminClient from '@/lib/adminClient';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  X, MapPin, Truck, CreditCard, Package, Mail, Phone,
  MessageCircle, Building2, Copy, ExternalLink, Send, CheckCircle2
} from 'lucide-react';
import { COURIER_LABELS, getCourierName, getTrackingUrl } from '@nutrablue/shared';

const formatPrice = (price) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price || 0);

const formatDelivery = (order) => {
  if (order.delivery_method === 'retiro_vendedor') return 'Retiro con vendedor';
  if (order.delivery_method === 'retiro_courier') {
    return `Retiro en sucursal · ${COURIER_LABELS[order.courier] || getCourierName(order.courier) || 'transporte por definir'}`;
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
 * Enlace de WhatsApp con mensaje personalizado y enlace directo de seguimiento.
 */
const armarEnlaceWhatsApp = (order) => {
  const telefono = (order?.phone || '').replace(/[^\d]/g, '');
  if (!telefono) return null;

  const codigo = order.tracking_code;
  const empresa = COURIER_LABELS[order.shipping_company] || COURIER_LABELS[order.courier] || 'el courier';
  const idCorto = String(order.id || '').slice(0, 8).toUpperCase();
  const urlTracking = getTrackingUrl(order.shipping_company, codigo);

  let mensaje = '';
  if (codigo) {
    mensaje = `¡Hola ${order.customer_name || ''}! Te escribimos de NutraBlue para contarte que tu pedido #${idCorto} ya fue despachado a través de ${empresa}.\n\nCódigo de seguimiento: ${codigo}\nPuedes rastrearlo directamente aquí: ${urlTracking || 'https://nutrablue.cl/seguimiento'}\n\n¡Muchas gracias por tu compra!`;
  } else {
    mensaje = `¡Hola ${order.customer_name || ''}! Te escribimos de NutraBlue respecto a tu pedido #${idCorto}.`;
  }

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
const OrderDetailModal = ({ orderId, onClose, onOrderUpdated }) => {
  const [order, setOrder] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [loading, setLoading] = useState(true);

  // Formulario de despacho integrado
  const [shippingCompany, setShippingCompany] = useState('starken');
  const [trackingCode, setTrackingCode] = useState('');
  const [shippingPayment, setShippingPayment] = useState('por_pagar');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [submittingShipping, setSubmittingShipping] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let cancelado = false;

    (async () => {
      try {
        setLoading(true);
        const data = await adminClient.getOrder(orderId);
        if (!cancelado) {
          setOrder(data);
          // Preconfigurar courier preferido si coincide
          if (data.courier && ['starken', 'chilexpress', 'blue_express', 'correos_chile', 'pullman'].includes(data.courier)) {
            setShippingCompany(data.courier);
          }
          // Regla comercial: sobre $50.000 NutraBlue asume el envio
          if ((data.total || 0) >= 50000) {
            setShippingPayment('pagado');
          } else {
            setShippingPayment('por_pagar');
          }
        }
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

  const handleRegistrarDespacho = async (e) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
      toast.error('Ingresa el código de seguimiento del courier');
      return;
    }

    try {
      setSubmittingShipping(true);
      const res = await adminClient.shipOrder(order.id, {
        tracking_code: trackingCode.trim(),
        shipping_company: shippingCompany,
        shipping_payment: shippingPayment,
        notify_customer: notifyCustomer,
      });

      toast.success(`Pedido despachado exitosamente. ${notifyCustomer ? 'Se envió correo al cliente.' : ''}`);
      setOrder((prev) => ({
        ...prev,
        status: 'shipped',
        tracking_code: trackingCode.trim(),
        shipping_company: shippingCompany,
        shipping_payment: shippingPayment,
        shipped_at: new Date().toISOString(),
      }));

      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      toast.error(err.message || 'Error al registrar el despacho');
    } finally {
      setSubmittingShipping(false);
    }
  };

  useEffect(() => {
    const alCerrarConEscape = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alCerrarConEscape);
    return () => window.removeEventListener('keydown', alCerrarConEscape);
  }, [onClose]);

  if (!orderId) return null;

  const items = order?.items || [];
  const direccion = [order?.address, order?.city, order?.region].filter(Boolean).join(', ');

  // El RUT se guarda normalizado ("12345678-5"); acá se muestra con puntos, que es como
  // se lee y como se pega en un sistema contable.
  const formatearRut = (valor) => {
    const limpio = String(valor || '').replace(/[^0-9kK]/g, '').toUpperCase();
    if (limpio.length < 2) return valor || '—';
    return `${limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${limpio.slice(-1)}`;
  };

  const copiarFacturacion = async () => {
    const texto = [
      `RUT: ${formatearRut(order?.tax_id)}`,
      `Razón social: ${order?.business_name || ''}`,
      `Giro: ${order?.business_activity || ''}`,
      `Domicilio comercial: ${order?.billing_address || ''}`,
      `Correo: ${order?.billing_email || order?.email || ''}`,
      `Total: ${order?.total ?? ''}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      // Vuelve solo: dejar "Copiado" fijo hace dudar de si el segundo clic funcionó.
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* portapapeles bloqueado (sitio sin https o permiso denegado): los datos igual
         están a la vista arriba para copiarlos a mano */
    }
  };
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

            {order.is_company && (
              /* Estos datos existen para emitir la factura a mano: NutraBlue todavia no
                 emite factura electronica, asi que alguien los copia al sistema
                 contable. De ahi el boton de copiar todo junto. */
              <div className="mb-4">
                <Seccion icon={Building2} titulo="Facturación">
                  <dl className="space-y-2">
                    <Campo label="RUT">
                      <span className="font-mono font-semibold">{formatearRut(order.tax_id)}</span>
                    </Campo>
                    <Campo label="Razón social">{order.business_name}</Campo>
                    <Campo label="Giro">{order.business_activity}</Campo>
                    <Campo label="Domicilio comercial">{order.billing_address}</Campo>
                    <Campo label="Correo de facturación">
                      {order.billing_email ? (
                        <a href={`mailto:${order.billing_email}`} className="text-primary hover:underline">
                          {order.billing_email}
                        </a>
                      ) : '—'}
                    </Campo>
                  </dl>

                  <button
                    type="button"
                    onClick={copiarFacturacion}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    {copiado ? 'Copiado' : 'Copiar datos de facturación'}
                  </button>
                </Seccion>
              </div>
            )}

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
                {order.tracking_code ? (
                  <div>
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Campo label="Código de seguimiento">
                        <span className="font-mono text-sm font-bold text-primary">{order.tracking_code}</span>
                      </Campo>
                      <Campo label="Empresa">{COURIER_LABELS[order.shipping_company] || getCourierName(order.shipping_company) || '—'}</Campo>
                      <Campo label="Despachado el">{order.shipped_at ? formatDate(order.shipped_at) : null}</Campo>
                      <Campo label="Flete">
                        {order.shipping_payment === 'pagado' ? 'Pagado (NutraBlue)' : 'Por pagar al recibir'}
                      </Campo>
                    </dl>

                    <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-border/60">
                      {getTrackingUrl(order.shipping_company, order.tracking_code) && (
                        <a
                          href={getTrackingUrl(order.shipping_company, order.tracking_code)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors shadow-sm"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Rastrear en {COURIER_LABELS[order.shipping_company] || getCourierName(order.shipping_company)}
                        </a>
                      )}

                      {enlaceWhatsApp && (
                        <a
                          href={enlaceWhatsApp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Avisar por WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRegistrarDespacho} className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Truck className="h-4 w-4" /> Registrar Despacho para este Pedido
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Destino: <strong className="text-foreground">{direccion || 'Por definir'}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Empresa de Transporte</label>
                        <select
                          value={shippingCompany}
                          onChange={(e) => setShippingCompany(e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="starken">Starken</option>
                          <option value="chilexpress">Chilexpress</option>
                          <option value="blue_express">Blue Express</option>
                          <option value="correos_chile">Correos de Chile</option>
                          <option value="pullman">Pullman Cargo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Código de Seguimiento / OT</label>
                        <input
                          type="text"
                          placeholder="Ej: ST-9481720491 o 99281726"
                          value={trackingCode}
                          onChange={(e) => setTrackingCode(e.target.value)}
                          required
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Modalidad de Flete</label>
                        <select
                          value={shippingPayment}
                          onChange={(e) => setShippingPayment(e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="pagado">Pagado (Asume NutraBlue - Compras &ge; $50.000)</option>
                          <option value="por_pagar">Por pagar (Cancela cliente al recibir)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 sm:pt-5">
                        <input
                          type="checkbox"
                          id="notify_cust_modal"
                          checked={notifyCustomer}
                          onChange={(e) => setNotifyCustomer(e.target.checked)}
                          className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                        />
                        <label htmlFor="notify_cust_modal" className="text-xs text-foreground cursor-pointer select-none">
                          Enviar correo con tracking al cliente ({order.email})
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-primary/15">
                      <p className="text-[11px] text-muted-foreground">
                        Al confirmar, el pedido pasa a estado <strong>SHIPPED</strong> y se guarda el código.
                      </p>
                      <Button
                        type="submit"
                        disabled={submittingShipping}
                        size="sm"
                        className="rounded-xl gap-1.5 bg-primary hover:bg-primary/90 text-xs w-full sm:w-auto"
                      >
                        {submittingShipping ? 'Guardando...' : (
                          <>
                            <Send className="h-3.5 w-3.5" /> Confirmar y Despachar Pedido
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
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
