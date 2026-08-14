import React, { useState, useEffect } from 'react';
import { Helmet } from '@/components/Meta';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ClipboardList, MapPin, CreditCard, User, LogOut, Package, ShieldCheck, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const AccountContent = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const displayName = currentUser?.user_metadata?.full_name || currentUser?.email.split('@')[0];

  const [orders, setOrders] = useState([]);
  const [addressData, setAddressData] = useState({
    address: '',
    city: '',
    region: '',
    phone: ''
  });
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const savedAddress = localStorage.getItem('nutra_blue_user_address');
    if (savedAddress) {
      try {
        setAddressData(JSON.parse(savedAddress));
      } catch (err) {
        console.error('Error loading address:', err);
      }
    }
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser?.email) return;
      try {
        const res = await fetch(`/hcgi/api/orders?email=${encodeURIComponent(currentUser.email)}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [currentUser]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'paid': return 'Pagado';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status || 'Pendiente';
    }
  };

  const getTrackingStep = (status) => {
    switch (status) {
      case 'pending': return 1;
      case 'paid': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      default: return 1;
    }
  };

  const COURIER_LABELS = {
    blue_express: 'Blue Express',
    starken: 'Starken',
    pullman: 'Pullman'
  };

  // La empresa de transporte se guarda en shipping_company al despachar; antes de eso
  // solo esta el courier que el cliente eligio en el checkout, si eligio retiro.
  const getCourierLabel = (order) => {
    const clave = order.shipping_company || order.courier;
    return COURIER_LABELS[clave] || 'Despacho NutraBlue';
  };

  const getDeliveryLabel = (order) => {
    if (order.delivery_method === 'retiro_courier') {
      return `Retiro en sucursal · ${COURIER_LABELS[order.courier] || 'transporte por definir'}`;
    }
    return 'Envío a domicilio';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    localStorage.setItem('nutra_blue_user_address', JSON.stringify(addressData));
    toast.success('Dirección de despacho guardada con éxito.');
  };

  return (
    <>
      <Helmet>
        <title>Mi Cuenta - NutraBlue</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <Header />
      
      <main className="min-h-screen bg-[#fbfbfa] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Mi Cuenta
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bienvenido de vuelta, <span className="font-semibold text-primary">{displayName}</span>
              </p>
            </div>
            
            <div className="flex gap-3">
              {isAdmin && (
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to="/admin">Panel de Administración</Link>
                </Button>
              )}
              <Button variant="ghost" onClick={logout} className="rounded-xl flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-4 w-4" /> Cerrar Sesión
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <div className="bg-card rounded-xl p-4 shadow-sm border border-border space-y-1.5">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'orders' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <ClipboardList className="h-4 w-4" /> Mis Pedidos
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'addresses' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <MapPin className="h-4 w-4" /> Direcciones
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'profile' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <User className="h-4 w-4" /> Información Perfil
                </button>
              </div>
            </aside>

            {/* Main Area */}
            <div className="lg:col-span-3">
              {/* Tab: Orders */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-foreground">Historial de Pedidos & Tracking</h2>
                  {loadingOrders ? (
                    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm text-center py-12">
                      <p className="text-sm text-muted-foreground">Cargando tus pedidos...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm text-center py-12 space-y-4">
                      <Package className="h-12 w-12 text-muted-foreground/60 mx-auto animate-bounce" />
                      <p className="text-sm text-muted-foreground">Aún no has realizado ningún pedido.</p>
                      <Button asChild className="rounded-xl">
                        <Link to="/shop">Ir a la Tienda</Link>
                      </Button>
                    </div>
                  ) : (
                    orders.map((order) => {
                      const step = getTrackingStep(order.status);
                      return (
                        <div key={order.id} className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/40 pb-4 gap-2">
                            <div>
                              <p className="text-sm font-black text-primary">ID: {order.id.slice(0, 8).toUpperCase()}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Realizado el {formatDate(order.created_at || order.date)}</p>
                            </div>
                            <div className="text-right sm:text-right">
                              <p className="text-sm font-bold text-foreground">{formatPrice(order.total)}</p>
                              <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                                order.status === 'delivered' || order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'
                              }`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalle del Pedido</p>
                            {(order.items || []).map((item, i) => {
                              // La API ya devuelve nombre y subtotal por línea. El respaldo
                              // existe porque antes se multiplicaba un precio inexistente y
                              // el cliente veía "NaN" donde iba el monto.
                              const cantidad = item.quantity ?? item.qty ?? 0;
                              const unitario = item.unit_price ?? item.price;
                              const subtotal = item.line_total ?? (Number.isFinite(unitario) ? unitario * cantidad : null);
                              return (
                                <div key={i} className="flex justify-between items-start gap-3 text-sm">
                                  <span className="text-foreground">
                                    {item.name || 'Producto'}{' '}
                                    <span className="text-xs text-muted-foreground font-semibold">x{cantidad}</span>
                                  </span>
                                  <span className="font-semibold text-foreground whitespace-nowrap">
                                    {subtotal != null ? formatPrice(subtotal) : '—'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Dónde y cómo llega. Antes el pedido no decía nada de esto:
                              el cliente veía el total y el estado, pero no a qué dirección
                              iba ni si era despacho o retiro. */}
                          <div className="rounded-xl bg-muted/40 p-3 space-y-1.5 text-xs">
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Entrega</span>
                              <span className="font-semibold text-foreground text-right">{getDeliveryLabel(order)}</span>
                            </div>
                            {order.address && (
                              <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground shrink-0">Dirección</span>
                                <span className="text-foreground text-right">
                                  {[order.address, order.city, order.region].filter(Boolean).join(', ')}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Despacho</span>
                              <span className={`font-semibold ${order.shipping_cost ? 'text-foreground' : 'text-success'}`}>
                                {order.shipping_cost ? formatPrice(order.shipping_cost) : 'Sin costo'}
                              </span>
                            </div>
                          </div>

                          {/* Tracking Progress Visualizer */}
                          <div className="pt-4 border-t border-border/45 space-y-4">
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>Courier: <strong className="text-foreground">{getCourierLabel(order)}</strong></span>
                              <span>Código de Seguimiento: <strong className="text-foreground flex items-center gap-1 cursor-pointer hover:underline" onClick={() => {
                                const trackingCode = order.tracking_code;
                                if (trackingCode) {
                                  navigator.clipboard.writeText(trackingCode);
                                  toast.success('Código copiado al portapapeles');
                                } else {
                                  toast.info('Código de seguimiento pendiente de asignación');
                                }
                              }}>{order.tracking_code || 'Pendiente'} <ExternalLink className="h-3 w-3" /></strong></span>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative pt-2">
                              <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100">
                                <div
                                  style={{ width: `${(step / 4) * 100}%` }}
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
                                />
                              </div>
                              
                              <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold mt-3">
                                <span className={step >= 1 ? 'text-primary font-black' : ''}>1. PROCESANDO</span>
                                <span className={step >= 2 ? 'text-primary font-black' : ''}>2. PAGADO</span>
                                <span className={step >= 3 ? 'text-primary font-black' : ''}>3. ENVIADO</span>
                                <span className={step >= 4 ? 'text-primary font-black' : ''}>4. ENTREGADO</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab: Addresses */}
              {activeTab === 'addresses' && (
                <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-6">
                  <h2 className="text-xl font-bold text-foreground">Dirección de Despacho</h2>
                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dirección (Calle y Número)</label>
                        <input
                          type="text"
                          required
                          placeholder="Av. Vitacura 1234, Depto 402"
                          value={addressData.address}
                          onChange={(e) => setAddressData({...addressData, address: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Comuna</label>
                        <input
                          type="text"
                          required
                          placeholder="Vitacura"
                          value={addressData.city}
                          onChange={(e) => setAddressData({...addressData, city: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Región</label>
                        <input
                          type="text"
                          required
                          placeholder="Metropolitana"
                          value={addressData.region}
                          onChange={(e) => setAddressData({...addressData, region: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Teléfono de Contacto</label>
                        <input
                          type="text"
                          required
                          placeholder="+56 9 1234 5678"
                          value={addressData.phone}
                          onChange={(e) => setAddressData({...addressData, phone: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="bg-primary text-white hover:bg-primary/95 px-6 py-3 rounded-xl">
                      Guardar Dirección
                    </Button>
                  </form>
                </div>
              )}



              {/* Tab: Profile */}
              {activeTab === 'profile' && (
                <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-6">
                  <h2 className="text-xl font-bold text-foreground">Información del Perfil</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/15">
                      <div className="bg-primary text-white p-3 rounded-full">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span>Tus datos de perfil están protegidos bajo cifrado de base de datos oficial.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

const AccountPage = () => (
  <ProtectedRoute>
    <AccountContent />
  </ProtectedRoute>
);

export default AccountPage;
