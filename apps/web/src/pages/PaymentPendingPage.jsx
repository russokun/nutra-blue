import React, { useState, useEffect } from 'react';
import { Helmet } from '@/components/Meta';
import { useParams, Link } from 'react-router-dom';
import { Clock, Mail, Package, Truck, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import dataClient from '@/lib/dataClient';
import { useCart } from '@/hooks/useCart';

/**
 * Pago pendiente de confirmación.
 *
 * Mercado Pago manda acá cuando el pago no se resuelve al instante: efectivo,
 * transferencia o una tarjeta que queda en revisión. Antes estos casos volvían a
 * `/checkout` sin ningún aviso, así que el cliente veía el formulario vacío, creía que no
 * se había hecho nada y podía terminar pagando dos veces.
 *
 * Muestra el pedido completo, no solo el número: quien queda esperando una confirmación
 * quiere ver qué compró y cuánto, igual que en la página de pago confirmado.
 */

const COURIER_LABELS = {
  blue_express: 'Blue Express',
  starken: 'Starken',
  pullman: 'Pullman',
};

const PASOS = [
  { titulo: 'Pedido recibido', detalle: 'Guardamos los productos a tu nombre' },
  { titulo: 'Confirmación del pago', detalle: 'Esperando a Mercado Pago' },
  { titulo: 'Preparación y despacho', detalle: 'Te enviamos el código de seguimiento' },
];

const PaymentPendingPage = () => {
  const { orderId } = useParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // El pedido está creado: dejarle el carrito lleno lo invitaría a comprar de nuevo.
    const pendienteRaw = sessionStorage.getItem('nutra_blue_pending_order');
    if (!pendienteRaw) return;
    try {
      const pendiente = JSON.parse(pendienteRaw);
      if (pendiente.orderId === orderId) {
        clearCart();
        sessionStorage.removeItem('nutra_blue_pending_order');
        sessionStorage.removeItem('nutra_blue_checkout_borrador');
      }
    } catch {
      sessionStorage.removeItem('nutra_blue_pending_order');
    }
  }, [orderId, clearCart]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const registro = await dataClient.collection('orders').getOne(orderId);
        if (!cancelado) setOrder(registro);
      } catch (err) {
        // Si este navegador no puede acreditar el pedido, la página igual sirve: el
        // mensaje y el número son lo importante. No se muestra ningún error.
        console.warn('No se pudo cargar el resumen del pedido:', err);
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [orderId]);

  const formatPrice = (precio) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(precio || 0);

  const entrega =
    order?.delivery_method === 'retiro_courier'
      ? `Retiro en sucursal · ${COURIER_LABELS[order.courier] || 'transporte por definir'}`
      : 'Envío a domicilio';

  return (
    <>
      <Helmet>
        <title>Pago en proceso — NutraBlue</title>
        <meta name="description" content="Tu pago está siendo confirmado por Mercado Pago." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 mb-8 text-center">
            <Clock className="h-14 w-14 text-amber-600 mx-auto mb-4" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-display text-foreground mb-2">
              Tu pago se está confirmando
            </h1>
            <p className="text-base text-muted-foreground mx-auto">
              Mercado Pago todavía no nos confirma el pago. Es normal con transferencia,
              efectivo o cuando el banco necesita revisar la operación.
            </p>
          </div>

          {/* Qué falta y qué sigue */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-5">Qué pasa ahora</h2>
            <ol className="space-y-4">
              {PASOS.map((paso, i) => (
                <li key={paso.titulo} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      i === 0
                        ? 'bg-success text-white'
                        : i === 1
                        ? 'bg-amber-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i === 0 ? '✓' : i + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-card-foreground">{paso.titulo}</span>
                    <span className="block text-xs text-muted-foreground">{paso.detalle}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-muted/40 p-4">
              <Mail className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">No tienes que hacer nada más.</strong>{' '}
                Te escribimos apenas se confirme el pago, junto con los detalles del envío.
                Si Mercado Pago te dejó instrucciones para completar el pago, sigue esas.
              </p>
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-5">Tu pedido</h2>

            <div className="mb-5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Número de pedido
              </span>
              <span className="font-mono text-sm font-bold text-primary break-all">{orderId}</span>
            </div>

            {loading ? (
              <div className="space-y-3 border-t border-border pt-4">
                <Skeleton className="h-5 w-full rounded" />
                <Skeleton className="h-5 w-2/3 rounded" />
              </div>
            ) : order ? (
              <>
                <div className="space-y-2 border-t border-border pt-4">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-card-foreground">
                        {item.name || 'Producto'}{' '}
                        <span className="text-xs font-semibold text-muted-foreground">x{item.quantity}</span>
                      </span>
                      <span className="whitespace-nowrap font-semibold text-card-foreground">
                        {item.line_total != null ? formatPrice(item.line_total) : '—'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5" aria-hidden="true" /> {entrega}
                    </span>
                    <span className={order.shipping_cost ? '' : 'font-semibold text-success'}>
                      {order.shipping_cost ? formatPrice(order.shipping_cost) : 'Sin costo'}
                    </span>
                  </div>
                  {order.address && (
                    <p className="text-xs text-muted-foreground">
                      {[order.address, order.city, order.region].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold text-card-foreground">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                Guarda este número. El detalle completo te llega por correo y queda en{' '}
                <Link to="/account" className="text-primary hover:underline">Mi Cuenta</Link>.
              </p>
            )}
          </div>

          {/* Invitación a seguir en la tienda */}
          <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center">
            <Package className="mx-auto mb-3 h-7 w-7 text-primary" aria-hidden="true" />
            <p className="mx-auto mb-5 text-sm text-muted-foreground">
              Mientras tanto puedes seguir mirando el catálogo. Si agregas algo antes de que
              despachemos, lo enviamos todo junto y te ahorras un segundo despacho.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild className="gap-2 rounded-xl">
                <Link to="/shop">
                  Seguir viendo productos <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/account">Ver mis pedidos</Link>
              </Button>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
};

export default PaymentPendingPage;
