import React, { useEffect } from 'react';
import { Helmet } from '@/components/Meta';
import { useParams, Link } from 'react-router-dom';
import { Clock, Mail, Package } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';

/**
 * Pago pendiente de confirmación.
 *
 * Mercado Pago manda acá cuando el pago no se resuelve al instante: efectivo, transferencia
 * o una tarjeta que queda en revisión. Antes estos casos volvían a `/checkout` sin ningún
 * aviso, así que el cliente veía el formulario vacío, creía que no se había hecho nada y
 * podía terminar pagando dos veces.
 *
 * El pedido ya existe y tiene el stock reservado; solo falta que Mercado Pago confirme.
 * Cuando lo haga, el webhook lo pasa a pagado y sale el correo de confirmación.
 */
const PaymentPendingPage = () => {
  const { orderId } = useParams();
  const { clearCart } = useCart();

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

  return (
    <>
      <Helmet>
        <title>Pago en proceso — NutraBlue</title>
        <meta name="description" content="Tu pago está siendo confirmado por Mercado Pago." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main className="min-h-[70vh] bg-background py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-6">
            <Clock className="h-8 w-8" aria-hidden="true" />
          </div>

          <h1 className="text-3xl md:text-4xl font-display text-foreground mb-3">
            Tu pago se está confirmando
          </h1>
          <p className="text-base text-muted-foreground mx-auto mb-8">
            Mercado Pago todavía no nos confirma el pago. Esto es normal con transferencia,
            efectivo o cuando el banco necesita revisar la operación.
          </p>

          {orderId && (
            <div className="rounded-2xl border border-border bg-card p-5 mb-8 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Número de pedido
              </p>
              <p className="font-mono text-sm font-bold text-primary break-all mt-1">{orderId}</p>
            </div>
          )}

          <div className="space-y-3 text-left mb-10">
            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
              <Package className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Tu pedido ya está reservado.</strong>{' '}
                Guardamos los productos a tu nombre mientras se confirma el pago.
                No hace falta que vuelvas a comprarlos.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
              <Mail className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Te avisamos por correo</strong> apenas
                Mercado Pago confirme el pago, junto con los detalles del envío.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/account">Ver mis pedidos</Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link to="/shop">Seguir viendo el catálogo</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default PaymentPendingPage;
