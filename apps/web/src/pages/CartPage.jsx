import React, { useState, useEffect } from 'react';
import { Helmet } from '@/components/Meta';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, Shield, Truck, Lock, Gift, PlusCircle } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import dataClient from '@/lib/dataClient';
import { isFreeShipping, shippingHint, shippingLabel } from '@/lib/shipping';
import { toast } from 'sonner';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, getCartTotal, addToCart } = useCart();
  const [upsellProduct, setUpsellProduct] = useState(null);
  const [loadingUpsell, setLoadingUpsell] = useState(true);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const total = getCartTotal();
  const tax = Math.round(total - (total / 1.19)); // 19% IVA incluido
  const subtotal = total - tax;
  const envioGratis = isFreeShipping(total);

  useEffect(() => {
    const loadUpsellProduct = async () => {
      try {
        setLoadingUpsell(true);
        const list = await dataClient.collection('products').getFullList();
        const cartIds = new Set(cart.map(item => item.id));
        const available = list.filter(p => !cartIds.has(p.id) && p.stock > 0);
        if (available.length > 0) {
          // Select a relevant product as upsell (e.g. the first one available)
          setUpsellProduct(available[0]);
        } else {
          setUpsellProduct(null);
        }
      } catch (e) {
        console.error('Failed to load upsell product:', e);
      } finally {
        setLoadingUpsell(false);
      }
    };

    if (cart.length > 0) {
      loadUpsellProduct();
    }
  }, [cart]);

  const handleAddUpsell = (product) => {
    addToCart(product, 1);
    toast.success(`${product.name} añadido a tu carrito`);
  };

  if (cart.length === 0) {
    return (
      <>
        <Helmet>
          <title>Carrito - NutraBlue</title>
          <meta name="description" content="Tu carrito de compras en NutraBlue" />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

        <Header minimal />

        <main className="min-h-screen bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-muted rounded-2xl p-12 text-center max-w-lg mx-auto border border-border/40">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-display text-foreground mb-2">Tu carrito está vacío</h2>
              <p className="text-muted-foreground mb-6">Agrega productos premium para comenzar tu optimización biológica.</p>
              <Button asChild className="rounded-xl px-8 py-5">
                <Link to="/shop">Explorar Catálogo</Link>
              </Button>
            </div>
          </div>
        </main>

        <Footer minimal />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Carrito - NutraBlue</title>
        <meta name="description" content="Revisa tu carrito de compras en NutraBlue" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header minimal />

      <main className="min-h-screen bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            className="text-3xl md:text-4xl font-display text-foreground mb-8"
          >
            Carrito de Compras
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Cart Items & Upsell */}
            <div className="lg:col-span-2 space-y-6">
              {/* Aviso de despacho. Dice lo mismo que el checkout, para que el cliente no
                  se encuentre con una condicion distinta una pantalla despues. */}
              <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                <span className="flex items-start gap-2 text-sm font-semibold text-card-foreground">
                  <Truck className={`h-4 w-4 shrink-0 mt-0.5 ${envioGratis ? 'text-success' : 'text-amber-600'}`} />
                  <span>
                    <span className={`block font-bold ${envioGratis ? 'text-success' : 'text-amber-700'}`}>
                      {envioGratis ? 'Envío gratis a todo Chile' : 'Envío por pagar'}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                      {shippingHint(total)}
                    </span>
                  </span>
                </span>
              </div>

              {/* Cart Items List */}
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                      {/* Image */}
                      <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-muted">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                        <h3 className="text-lg font-bold text-card-foreground">
                          {item.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Categoría: {item.category}
                        </p>
                        <p className="text-xl font-bold text-primary">
                          {formatPrice(item.price)}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-center sm:justify-start space-x-3 pt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 rounded-lg"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-semibold text-card-foreground w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="h-8 w-8 rounded-lg"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="flex flex-col items-center sm:items-end justify-between sm:h-24 pt-4 sm:pt-0">
                        <p className="text-lg font-bold text-card-foreground">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg mt-2"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upsell Widget */}
              {upsellProduct && (
                <div className="bg-card rounded-2xl p-6 border-2 border-dashed border-primary/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary hidden md:block">
                      <Gift className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-card-foreground flex items-center gap-1.5 justify-center md:justify-start">
                        Completa tu rutina de optimización
                      </h4>
                      <p className="text-xs text-muted-foreground text-center md:text-left">
                        Agrega <strong className="text-foreground">{upsellProduct.name}</strong> por <strong className="text-primary">{formatPrice(upsellProduct.price)}</strong> y completa tu rutina
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleAddUpsell(upsellProduct)}
                      className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs py-4 px-5 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5 font-bold"
                    >
                      <PlusCircle className="h-4 w-4" /> Agregar en 1-Clic
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Order Summary & Trust */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm sticky top-20 space-y-6">
                <h2 className="text-xl font-display text-card-foreground border-b border-border pb-4">
                  Resumen del Pedido
                </h2>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Neto (Subtotal sin IVA)</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>IVA Incluido (19%)</span>
                    <span className="font-medium">{formatPrice(tax)}</span>
                  </div>
                  {/* El monto nunca se cobra en la tienda; el umbral define quien paga el
                      flete. Antes esta fila decia "Calculado en checkout" bajo los $50.000,
                      lo que hacia pensar que se sumaria algo al total. */}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Costo de Despacho</span>
                    <span className={envioGratis ? 'text-success font-semibold' : 'text-amber-700 font-semibold'}>
                      {shippingLabel(total)}
                    </span>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-xl font-black text-card-foreground">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-base font-bold py-7 rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                    size="lg"
                  >
                    <Lock className="h-4 w-4" /> Pagar de Forma Segura
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full py-5 rounded-xl text-xs sm:text-sm border-border hover:bg-muted"
                  >
                    <Link to="/shop">Continuar Comprando</Link>
                  </Button>
                </div>

                {/* Security and Trust Badges */}
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Lock className="h-4 w-4 text-success flex-shrink-0" />
                    <span>Pago seguro encriptado SSL</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4 text-success flex-shrink-0" />
                    <span>Garantía de reembolso de 30 días</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Truck className="h-4 w-4 text-success flex-shrink-0" />
                    <span>Envíos rápidos y rastreables a todo Chile</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer minimal />
    </>
  );
};

export default CartPage;