import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Package } from 'lucide-react';
import dataClient from '@/lib/dataClient';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!order) {
      fetchOrder();
    } else {
      finalizeCheckout();
    }
  }, [orderId, order]);

  const finalizeCheckout = () => {
    const pendingRaw = sessionStorage.getItem('nutra_blue_pending_order');
    if (!pendingRaw) return;

    try {
      const pending = JSON.parse(pendingRaw);
      if (pending.orderId === orderId) {
        clearCart();
        sessionStorage.removeItem('nutra_blue_pending_order');
      }
    } catch {
      sessionStorage.removeItem('nutra_blue_pending_order');
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const record = await dataClient.collection('orders').getOne(orderId);
      setOrder(record);
      finalizeCheckout();
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('No se pudo cargar la orden. Por favor, verifica el número de orden.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEstimatedDelivery = (orderDate) => {
    const date = new Date(orderDate);
    date.setDate(date.getDate() + 7);
    return formatDate(date);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-12 w-3/4 mb-8" />
            <Skeleton className="h-64 w-full mb-6" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center">
              <p className="text-destructive mb-4">{error || 'Orden no encontrada'}</p>
              <Button asChild>
                <Link to="/shop">Volver al Catálogo</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Confirmación de Orden - Nutra Blue</title>
        <meta name="description" content="Tu orden ha sido confirmada exitosamente" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-success/10 border border-success/20 rounded-2xl p-8 mb-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h1
              className="text-3xl md:text-4xl font-bold text-foreground mb-2"
              style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
            >
              Pago Confirmado
            </h1>
            <p className="text-lg text-muted-foreground">
              Tu orden ha sido procesada exitosamente
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border shadow-sm mb-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-6">Detalles de la Orden</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Número de Orden</span>
                <span className="text-lg font-semibold text-card-foreground">{order.id}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Fecha de Orden</span>
                <span className="text-lg font-semibold text-card-foreground">{formatDate(order.created)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Cliente</span>
                <span className="text-lg font-semibold text-card-foreground">{order.customer_name}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Email</span>
                <span className="text-lg font-semibold text-card-foreground">{order.email}</span>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <span className="text-sm text-muted-foreground block mb-2">Dirección de Envío</span>
              <p className="text-card-foreground">
                {order.address}<br />
                {order.city}, {order.region}
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border shadow-sm mb-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-6">Productos</h2>

            <div className="space-y-4">
              {order.items && order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                  <div>
                    <span className="text-card-foreground font-medium">
                      {item.name || item.product_id}
                    </span>
                    <span className="text-muted-foreground text-sm ml-2">x{item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 mt-6 pt-6 border-t border-border">
              <div className="flex justify-between text-card-foreground">
                <span>Subtotal</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-card-foreground">
                <span>IVA (19%)</span>
                <span className="font-medium">{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between text-card-foreground">
                <span>Envío</span>
                <span className="font-medium">{formatPrice(order.shipping_cost)}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-xl font-bold text-card-foreground">
                  <span>Total Pagado</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <Package className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Entrega Estimada</h3>
                <p className="text-muted-foreground">
                  Tu pedido llegará aproximadamente el{' '}
                  <span className="font-semibold text-foreground">
                    {getEstimatedDelivery(order.created)}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Recibirás un email de confirmación con el número de seguimiento cuando tu pedido sea despachado.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1">
              <Link to="/shop">Volver al Catálogo</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default OrderConfirmationPage;
