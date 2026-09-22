import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from '@/components/Meta';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import dataClient from '@/lib/dataClient';
import { emailDePedido } from '@/lib/orderAccess';
import { COURIER_LABELS, getCourierName, getTrackingUrl } from '@nutrablue/shared';
import {
  Truck,
  Search,
  Package,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  MapPin,
  Calendar,
  MessageCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const formatPrice = (price) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const TrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderId = searchParams.get('order_id') || searchParams.get('id') || searchParams.get('tracking') || '';
  const initialEmail = searchParams.get('email') || '';

  const [orderInput, setOrderInput] = useState(initialOrderId);
  const [emailInput, setEmailInput] = useState(initialEmail || (initialOrderId ? emailDePedido(initialOrderId) : ''));
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Carga automatica si llega con parametros en la URL
  useEffect(() => {
    if (initialOrderId) {
      const email = initialEmail || emailDePedido(initialOrderId);
      buscarPedido(initialOrderId, email);
    }
  }, [initialOrderId, initialEmail]);

  const buscarPedido = async (idABuscar, emailABuscar) => {
    const cleanId = (idABuscar || orderInput).trim().replace(/^#/, '');
    const cleanEmail = (emailABuscar !== undefined ? emailABuscar : emailInput).trim();

    if (!cleanId) {
      toast.error('Por favor ingresa tu número o código de pedido');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Intenta obtener la orden via dataClient
      const emailParam = cleanEmail || emailDePedido(cleanId);
      const res = await dataClient.collection('orders').getOne(cleanId, { email: emailParam });

      if (res && res.id) {
        setOrder(res);
        // Actualizar URL sin recargar
        setSearchParams({ order_id: cleanId, ...(emailParam ? { email: emailParam } : {}) });
      } else {
        setOrder(null);
        setError('No encontramos un pedido con esos datos. Verifica que el número y tu correo coincidan.');
      }
    } catch (err) {
      console.error('Error buscando pedido:', err);
      setOrder(null);
      const msg = err.message || '';
      if (msg.includes('403') || msg.includes('Email')) {
        setError('Para proteger tu privacidad, ingresa el correo electrónico con el que realizaste la compra.');
      } else {
        setError('No encontramos ningún pedido registrado con ese identificador. Revisa el código en tu correo de confirmación.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    buscarPedido();
  };

  const copiarCodigo = (codigo) => {
    if (!codigo) return;
    navigator.clipboard.writeText(codigo);
    toast.success('Código de seguimiento copiado al portapapeles');
  };

  // Determinar etapa actual en la linea de tiempo (1..4)
  const getTimelineStep = () => {
    if (!order) return 1;
    const s = (order.status || '').toLowerCase();
    if (s === 'delivered' || s === 'entregado') return 4;
    if (s === 'shipped' || order.tracking_code) return 3;
    if (s === 'paid') return 2;
    return 1;
  };

  const currentStep = getTimelineStep();
  const courierName = order ? (COURIER_LABELS[order.shipping_company] || getCourierName(order.shipping_company) || getCourierName(order.courier)) : '';
  const trackingUrl = order ? (order.tracking_url || getTrackingUrl(order.shipping_company, order.tracking_code)) : '';
  const idCorto = order ? String(order.id).slice(0, 8).toUpperCase() : '';

  const whatsappSupportUrl = order
    ? `https://wa.me/56974587676?text=${encodeURIComponent(`Hola NutraBlue, tengo una consulta sobre el despacho de mi pedido #${idCorto}.`)}`
    : 'https://wa.me/56974587676?text=Hola%20NutraBlue,%20tengo%20una%20consulta%20sobre%20mi%20envío.';

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-primary/20">
      <Helmet>
        <title>Seguimiento de Envíos | Nutra Blue</title>
        <meta
          name="description"
          content="Revisa el estado de tu pedido y realiza seguimiento a tu despacho en tiempo real con Starken, Chilexpress, Blue Express y más."
        />
      </Helmet>

      <Header />

      <main className="flex-1 pb-20 pt-8 sm:pt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header Banner */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
              <Truck className="h-3.5 w-3.5" /> Estado de Envío en Tiempo Real
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-serif">
              Seguimiento de tu Pedido
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-2">
              Ingresa el número de orden que recibiste en tu correo de confirmación para consultar la ubicación y estado de tu entrega.
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm mb-10">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="order_input" className="text-xs font-semibold text-foreground">
                    N° de Pedido / ID de Compra <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground font-mono text-xs">
                      #
                    </span>
                    <Input
                      id="order_input"
                      type="text"
                      placeholder="Ej: B369C703 o tu ID completo"
                      value={orderInput}
                      onChange={(e) => setOrderInput(e.target.value)}
                      required
                      className="pl-8 font-mono text-sm uppercase rounded-xl border-border/80 focus-visible:ring-primary"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Lo encuentras en el asunto del correo de confirmación.
                  </p>
                </div>

                <div>
                  <Label htmlFor="email_input" className="text-xs font-semibold text-foreground">
                    Correo Electrónico de Compra
                  </Label>
                  <Input
                    id="email_input"
                    type="email"
                    placeholder="tu-correo@ejemplo.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="mt-1.5 rounded-xl border-border/80 focus-visible:ring-primary text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Necesario para validar pedidos en compras de clientes.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl px-6 py-2.5 font-semibold text-sm gap-2 w-full sm:w-auto shadow-sm"
                >
                  {loading ? (
                    'Consultando estado...'
                  ) : (
                    <>
                      <Search className="h-4 w-4" /> Consultar Seguimiento
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Results Area */}
          {error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive mb-10">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 text-destructive" />
              <p className="font-semibold text-base">No pudimos cargar la información del envío</p>
              <p className="text-xs mt-1 text-muted-foreground max-w-md mx-auto">{error}</p>
            </div>
          )}

          {order && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Status Header Banner */}
              <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Orden</span>
                      <span className="font-mono text-sm font-bold text-primary">#{idCorto}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        order.status === 'shipped' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                        order.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        order.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {order.status === 'shipped' ? 'Despachado en Camino' :
                         order.status === 'paid' ? 'Pago Confirmado' :
                         order.status === 'pending' ? 'Pendiente de Pago' : order.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Comprado el {formatDate(order.created_at || order.created)} por <strong>{order.customer_name}</strong>
                    </p>
                  </div>

                  {/* WhatsApp Support Shortcut */}
                  <a
                    href={whatsappSupportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" /> ¿Ayuda con tu despacho?
                  </a>
                </div>

                {/* Timeline Visualizer */}
                <div className="pt-8 pb-4">
                  <div className="relative">
                    {/* Line Background */}
                    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-muted rounded-full z-0" />
                    {/* Active Line */}
                    <div
                      className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-700"
                      style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                    />

                    {/* Timeline Steps */}
                    <div className="relative z-10 flex justify-between">
                      {[
                        { step: 1, title: 'Confirmado', icon: CheckCircle2, label: 'Orden Recibida' },
                        { step: 2, title: 'Preparando', icon: Package, label: 'Pago Verificado' },
                        { step: 3, title: 'Despachado', icon: Truck, label: 'En el Courier' },
                        { step: 4, title: 'Entregado', icon: ShieldCheck, label: 'Recibido' },
                      ].map((s) => {
                        const isDone = currentStep >= s.step;
                        const isCurrent = currentStep === s.step;
                        const Icon = s.icon;
                        return (
                          <div key={s.step} className="flex flex-col items-center">
                            <div
                              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                                isDone
                                  ? 'bg-primary text-white ring-4 ring-primary/20 font-bold'
                                  : 'bg-background border-2 border-border text-muted-foreground'
                              }`}
                            >
                              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <span className={`text-[11px] sm:text-xs font-bold mt-2 ${isCurrent ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {s.title}
                            </span>
                            <span className="hidden sm:block text-[10px] text-muted-foreground mt-0.5 text-center">
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Courier Tracking Highlights Card (If Dispatched) */}
              {order.tracking_code ? (
                <div className="bg-gradient-to-br from-sky-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
                    <Truck className="w-64 h-64 text-white" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-bold text-sky-200">
                        <Truck className="h-3.5 w-3.5 text-sky-400" />
                        Envío Gestionado por {courierName || 'Courier Oficial'}
                      </div>
                      {order.shipped_at && (
                        <span className="text-xs text-sky-200/80">
                          Despachado: {formatDate(order.shipped_at)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-sky-300 font-semibold mb-1">
                          Código de Seguimiento / N° de Envío
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-2xl sm:text-3xl font-black tracking-wider text-white select-all">
                            {order.tracking_code}
                          </span>
                          <button
                            onClick={() => copiarCodigo(order.tracking_code)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                            title="Copiar código"
                            aria-label="Copiar código al portapapeles"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-sky-200/80 mt-2">
                          {order.shipping_payment === 'pagado'
                            ? 'Envío pagado por NutraBlue (sin cobros al recibir)'
                            : 'Modalidad: Flete por pagar al momento de la entrega'}
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end justify-center gap-3">
                        {trackingUrl && (
                          <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 hover:opacity-95 transition-opacity shadow-lg w-full sm:w-auto"
                          >
                            <span>Rastrear en {courierName}</span>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <span className="text-[11px] text-sky-200/70 text-center sm:text-right">
                          Abre directamente el sistema oficial de transporte
                        </span>
                      </div>
                    </div>

                    {/* Anti-anxiety Advice Box */}
                    <div className="mt-6 pt-5 border-t border-white/10 text-xs text-sky-100/90 leading-relaxed flex items-start gap-2.5">
                      <Clock className="h-4 w-4 text-sky-300 shrink-0 mt-0.5" />
                      <div>
                        <strong>¿Aún no registra movimientos?</strong> Las empresas de transporte pueden demorar entre <strong>1 y 3 horas</strong> en sincronizar los códigos en su plataforma tras recibir el bulto en sucursal.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border/80 rounded-2xl p-6 text-center text-sm">
                  <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-foreground text-base">Tu pedido se encuentra en preparación</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    Estamos preparando tus productos para entregarlos al courier. En cuanto el paquete sea admitido, recibirás tu código de seguimiento por correo y podrás rastrearlo directamente aquí.
                  </p>
                </div>
              )}

              {/* Delivery & Items Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delivery Information */}
                <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Dirección de Entrega
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">{order.customer_name}</p>
                    <p>{order.address}</p>
                    <p>{order.city}, {order.region}</p>
                    {order.phone && <p className="text-xs pt-1">Teléfono: {order.phone}</p>}
                  </div>
                </div>

                {/* Items in the Order */}
                <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" /> Productos ({order.items?.length || 0})
                  </h3>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-border/40 last:border-0">
                        <div className="pr-2">
                          <span className="font-medium text-foreground">{item.name || item.product_id}</span>
                          <span className="text-muted-foreground ml-1.5 font-semibold">x{item.quantity}</span>
                        </div>
                        <span className="font-semibold text-foreground">
                          {formatPrice(item.line_total || (item.price * item.quantity))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackingPage;
