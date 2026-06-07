import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import apiServerClient from '@/lib/apiServerClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal } = useCart();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    number: '',
    city: '',
    region: '',
    postalCode: ''
  });

  const [errors, setErrors] = useState({});

  const chileanRegions = [
    'Arica y Parinacota',
    'Tarapacá',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'Valparaíso',
    'Metropolitana',
    'O\'Higgins',
    'Maule',
    'Ñuble',
    'Bío-Bío',
    'Araucanía',
    'Los Ríos',
    'Los Lagos',
    'Aysén',
    'Magallanes'
  ];

  const calculateShipping = (region) => {
    if (region === 'Metropolitana') return 5000;
    if (region === 'Valparaíso') return 7000;
    if (region === 'Bío-Bío') return 8000;
    return 10000;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const cartTotalAmount = getCartTotal();
  const tax = Math.round(cartTotalAmount - (cartTotalAmount / 1.19)); // 19% IVA incluido
  const subtotal = cartTotalAmount - tax;
  const shippingCost = formData.region ? calculateShipping(formData.region) : 0;
  const total = cartTotalAmount + shippingCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRegionChange = (value) => {
    setFormData(prev => ({ ...prev, region: value }));
    if (errors.region) {
      setErrors(prev => ({ ...prev, region: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
    if (!formData.address.trim()) newErrors.address = 'La dirección es requerida';
    if (!formData.number.trim()) newErrors.number = 'El número es requerido';
    if (!formData.city.trim()) newErrors.city = 'La ciudad es requerida';
    if (!formData.region) newErrors.region = 'La región es requerida';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'El código postal es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, completa todos los campos requeridos');
      return;
    }

    if (cart.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }

    setLoading(true);

    try {
      // Create order
      const orderData = {
        customer_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: `${formData.address} ${formData.number}`,
        city: formData.city,
        region: formData.region,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        subtotal,
        tax,
        shipping_cost: shippingCost,
        total
      };

      const orderResponse = await apiServerClient.fetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.detail || errorData.error || 'Error al crear la orden');
      }

      const order = await orderResponse.json();

      // Initialize Flow payment
      const paymentData = {
        order_id: order.id,
        amount: total,
        email: formData.email,
        phone: formData.phone,
        customer_name: formData.name
      };

      const paymentResponse = await apiServerClient.fetch('/payment/flow-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (!paymentResponse.ok) {
        throw new Error('Error al inicializar el pago');
      }

      const paymentResult = await paymentResponse.json();

      sessionStorage.setItem('nutra_blue_pending_order', JSON.stringify({
        orderId: order.id,
        email: formData.email,
      }));

      window.location.href = paymentResult.redirect_url;


    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Error al procesar el pago. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Checkout - Nutra Blue</title>
        <meta name="description" content="Completa tu compra en Nutra Blue" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            className="text-3xl md:text-4xl font-bold text-foreground mb-8"
            style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
          >
            Checkout
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Sections */}
              <div className="lg:col-span-2 space-y-8">
                {/* Section 1: Personal Data */}
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                  <h2 className="text-xl font-semibold text-card-foreground mb-6">Datos Personales</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-card-foreground">Nombre Completo *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`mt-1 text-gray-900 ${errors.name ? 'border-destructive' : ''}`}
                      />
                      {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-card-foreground">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`mt-1 text-gray-900 ${errors.email ? 'border-destructive' : ''}`}
                      />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="phone" className="text-card-foreground">Teléfono *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`mt-1 text-gray-900 ${errors.phone ? 'border-destructive' : ''}`}
                      />
                      {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Section 2: Shipping Address */}
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                  <h2 className="text-xl font-semibold text-card-foreground mb-6">Dirección de Envío</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address" className="text-card-foreground">Calle *</Label>
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={`mt-1 text-gray-900 ${errors.address ? 'border-destructive' : ''}`}
                      />
                      {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
                    </div>
                    <div>
                      <Label htmlFor="number" className="text-card-foreground">Número *</Label>
                      <Input
                        id="number"
                        name="number"
                        type="text"
                        value={formData.number}
                        onChange={handleInputChange}
                        className={`mt-1 text-gray-900 ${errors.number ? 'border-destructive' : ''}`}
                      />
                      {errors.number && <p className="text-sm text-destructive mt-1">{errors.number}</p>}
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-card-foreground">Ciudad *</Label>
                      <Input
                        id="city"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`mt-1 text-gray-900 ${errors.city ? 'border-destructive' : ''}`}
                      />
                      {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <Label htmlFor="region" className="text-card-foreground">Región *</Label>
                      <Select value={formData.region} onValueChange={handleRegionChange}>
                        <SelectTrigger className={`mt-1 text-gray-900 ${errors.region ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Selecciona una región" />
                        </SelectTrigger>
                        <SelectContent>
                          {chileanRegions.map(region => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.region && <p className="text-sm text-destructive mt-1">{errors.region}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="postalCode" className="text-card-foreground">Código Postal *</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        type="text"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className={`mt-1 text-gray-900 ${errors.postalCode ? 'border-destructive' : ''}`}
                      />
                      {errors.postalCode && <p className="text-sm text-destructive mt-1">{errors.postalCode}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm sticky top-20">
                  <h2 className="text-xl font-semibold text-card-foreground mb-6">Resumen del Pedido</h2>

                  {/* Cart Items */}
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between text-sm text-card-foreground">
                        <span className="flex-1">{item.name} x{item.quantity}</span>
                        <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex justify-between text-card-foreground">
                      <span>Subtotal</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-card-foreground">
                      <span>IVA (19%)</span>
                      <span className="font-medium">{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between text-card-foreground">
                      <span>Envío</span>
                      <span className="font-medium">
                        {formData.region ? formatPrice(shippingCost) : 'Selecciona región'}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between text-lg font-bold text-card-foreground">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 transition-all duration-200 active:scale-[0.98]"
                    size="lg"
                  >
                    {loading ? 'Procesando...' : 'Pagar con Flow'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default CheckoutPage;