import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
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

  // Mock Orders with Tracking for the Client Dashboard
  const mockOrders = [
    {
      id: 'NB-1042',
      date: '28 de Junio, 2026',
      total: 40490,
      status: 'En Tránsito',
      trackingStep: 3, // 1: Procesando, 2: Despachado, 3: En Tránsito, 4: Entregado
      courier: 'Starken',
      trackingCode: 'ST-9481720491',
      items: [
        { name: 'Calm & Focus', qty: 1, price: 18990 },
        { name: 'Reishi Mushroom Tea', qty: 1, price: 21500 }
      ]
    },
    {
      id: 'NB-1021',
      date: '12 de Mayo, 2026',
      total: 24990,
      status: 'Entregado',
      trackingStep: 4,
      courier: 'Chilexpress',
      trackingCode: 'CX-1049281749',
      items: [
        { name: 'Matcha Ritual', qty: 1, price: 24990 }
      ]
    }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    toast.success('Dirección de despacho guardada con éxito.');
  };

  return (
    <>
      <Helmet>
        <title>Mi Cuenta - Nutra Blue</title>
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
                  onClick={() => setActiveTab('payment')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'payment' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <CreditCard className="h-4 w-4" /> Métodos de Pago
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
                  {mockOrders.map((order) => (
                    <div key={order.id} className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/40 pb-4 gap-2">
                        <div>
                          <p className="text-sm font-black text-primary">{order.id}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Realizado el {order.date}</p>
                        </div>
                        <div className="text-right sm:text-right">
                          <p className="text-sm font-bold text-foreground">{formatPrice(order.total)}</p>
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                            order.status === 'Entregado' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalle del Pedido</p>
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-foreground">{item.name} <span className="text-xs text-muted-foreground font-semibold">x{item.qty}</span></span>
                            <span className="font-semibold text-foreground">{formatPrice(item.price * item.qty)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Tracking Progress Visualizer */}
                      <div className="pt-4 border-t border-border/45 space-y-4">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Courier: <strong className="text-foreground">{order.courier}</strong></span>
                          <span>Código de Seguimiento: <strong className="text-foreground flex items-center gap-1 cursor-pointer hover:underline" onClick={() => toast.info(`Código copiado: ${order.trackingCode}`)}>{order.trackingCode} <ExternalLink className="h-3 w-3" /></strong></span>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative pt-2">
                          <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100">
                            <div
                              style={{ width: `${(order.trackingStep / 4) * 100}%` }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
                            />
                          </div>
                          
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold mt-3">
                            <span className={order.trackingStep >= 1 ? 'text-primary font-black' : ''}>1. PROCESANDO</span>
                            <span className={order.trackingStep >= 2 ? 'text-primary font-black' : ''}>2. DESPACHADO</span>
                            <span className={order.trackingStep >= 3 ? 'text-primary font-black' : ''}>3. EN TRÁNSITO</span>
                            <span className={order.trackingStep >= 4 ? 'text-primary font-black' : ''}>4. ENTREGADO</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Comuna</label>
                        <input
                          type="text"
                          required
                          placeholder="Vitacura"
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
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Teléfono de Contacto</label>
                        <input
                          type="text"
                          required
                          placeholder="+56 9 1234 5678"
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

              {/* Tab: Payment */}
              {activeTab === 'payment' && (
                <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-6">
                  <h2 className="text-xl font-bold text-foreground">Métodos de Pago Guardados</h2>
                  <div className="border border-border/80 rounded-xl p-5 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-xl text-primary">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">•••• •••• •••• 9482</p>
                        <p className="text-xs text-muted-foreground">Visa - Vence el 12/29</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground bg-slate-100 border px-2.5 py-1 rounded-md uppercase">Predeterminada</span>
                  </div>
                  
                  <Button onClick={() => toast.info('Integración de pasarela segura para agregar tarjeta en desarrollo.')} variant="outline" className="rounded-xl w-full py-6 flex items-center justify-center gap-2 border-dashed">
                    + Agregar Nuevo Método de Pago
                  </Button>
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
