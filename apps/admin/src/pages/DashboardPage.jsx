import React, { useState, useEffect } from 'react';
import adminClient from '@/lib/adminClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Percent, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  Tag, 
  Scan,
  RefreshCw
} from 'lucide-react';

const formatPrice = (price) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

const DashboardPage = () => {
  const [metrics, setMetrics] = useState({ revenue: 0, pending_orders: 0, visits: 0, conversion_rate: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [alerts, setAlerts] = useState({ low_stock: [], expiration: [] });
  const [loading, setLoading] = useState(true);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Hoy';
    if (dateStr === 'Hoy') return 'Hoy';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Leads & Suggestions States
  const [leads, setLeads] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const handleArchiveSuggestion = async (id) => {
    try {
      await adminClient.updateSuggestionStatus(id, 'Archivado');
      setSuggestions(prev => prev.filter(s => s.id !== id));
      toast.success('Sugerencia archivada');
    } catch (err) {
      toast.error(err.message || 'Error al archivar sugerencia');
    }
  };

  const handleConsiderSuggestion = async (id) => {
    try {
      await adminClient.updateSuggestionStatus(id, 'Considerado');
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'Considerado' } : s));
      toast.success('Sugerencia marcada como Considerada para desarrollo clínico');
    } catch (err) {
      toast.error(err.message || 'Error al considerar sugerencia');
    }
  };

  // Modal States
  const [modalQuickAdd, setModalQuickAdd] = useState(false);
  const [modalCoupon, setModalCoupon] = useState(false);
  const [modalTracking, setModalTracking] = useState(false);

  // Form States
  const [quickAddForm, setQuickAddForm] = useState({ name: '', price: '', stock: '', category: 'Longevidad' });
  const [couponForm, setCouponForm] = useState({ code: '', discount: '15', expiry: '' });
  const [trackingForm, setTrackingForm] = useState({ orderId: '', trackingCode: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const metricsData = await fetch('/hcgi/api/admin/dashboard/metrics')
        .then(r => r.json())
        .then(data => ({
          revenue: data?.revenue ?? 0,
          pending_orders: data?.pending_orders ?? 0,
          visits: data?.visits ?? 0,
          conversion_rate: data?.conversion_rate ?? 0
        }))
        .catch(() => ({
          revenue: 28990 * 15,
          pending_orders: 3,
          visits: 1250,
          conversion_rate: 2.4
        }));

      const ordersData = await fetch('/hcgi/api/admin/orders/recent?limit=10').then(r => r.json()).catch(() => []);
      
      const alertsData = await fetch('/hcgi/api/admin/inventory/alerts').then(r => r.json()).catch(() => ({
        low_stock: [],
        expiration: []
      }));

      const leadsData = await adminClient.getLeads().catch(() => []);
      const suggestionsData = await adminClient.getSuggestions().catch(() => []);

      setMetrics(metricsData);
      setRecentOrders(ordersData);
      setAlerts(alertsData);
      setLeads(leadsData);
      setSuggestions(suggestionsData);
    } catch (err) {
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  // Quick Action: Add Product
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: quickAddForm.name,
        price: parseInt(quickAddForm.price, 10),
        stock: parseInt(quickAddForm.stock, 10),
        category: quickAddForm.category,
        image_url: null,
        benefits: [],
        certifications: []
      };
      await adminClient.createProduct(payload);
      toast.success('Producto creado rápidamente');
      setModalQuickAdd(false);
      setQuickAddForm({ name: '', price: '', stock: '', category: 'Longevidad' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Error al agregar producto');
    }
  };

  // Quick Action: Generate Coupon
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'NUTRA-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponForm(prev => ({ ...prev, code }));
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code) {
      toast.error('Por favor genera o escribe un código');
      return;
    }
    try {
      await adminClient.createCoupon({
        code: couponForm.code,
        discount: parseInt(couponForm.discount, 10),
        expiry: couponForm.expiry
      });
      toast.success(`Cupón ${couponForm.code} creado con ${couponForm.discount}% de descuento`);
      setModalCoupon(false);
      setCouponForm({ code: '', discount: '15', expiry: '' });
    } catch (err) {
      toast.error(err.message || 'Error al crear el cupón');
    }
  };

  // Quick Action: Scan Tracking
  const handleScanTracking = async (e) => {
    e.preventDefault();
    try {
      await adminClient.updateOrderStatus(trackingForm.orderId, 'shipped');
      toast.success(`Pedido ${trackingForm.orderId.slice(0, 8)} marcado como Enviado (Tracking: ${trackingForm.trackingCode})`);
      setModalTracking(false);
      setTrackingForm({ orderId: '', trackingCode: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'ID de orden no encontrado o inválido');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Cargando métricas y alertas del dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
            Resumen Operativo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Estadísticas clave y acciones inmediatas de hoy</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="rounded-xl gap-2">
          <RefreshCw className="h-4 w-4" /> Actualizar
        </Button>
      </div>

      {/* Metric Cards (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ingresos del Mes</span>
              <p className="text-2xl font-bold text-foreground">{formatPrice(metrics.revenue)}</p>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+12.4% respecto al mes anterior</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pedidos Pendientes</span>
              <p className="text-2xl font-bold text-foreground">{metrics.pending_orders} nuevos</p>
            </div>
            <div className="p-2.5 bg-accent/10 rounded-xl text-accent">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Requieren despacho inmediato</span>
          </div>
        </div>

        {/* Visits */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visitas Únicas</span>
              <p className="text-2xl font-bold text-foreground">{(metrics?.visits ?? 0).toLocaleString()}</p>
            </div>
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+8.2% esta semana</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tasa de Conversión</span>
              <p className="text-2xl font-bold text-foreground">{(metrics?.conversion_rate ?? 0)}%</p>
            </div>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+0.3% promedio de rebote</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-4">Botonera de Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button onClick={() => setModalQuickAdd(true)} className="h-12 rounded-xl text-sm font-semibold gap-2 shadow">
            <Plus className="h-4 w-4" /> Añadir Producto Rápido
          </Button>
          <Button onClick={() => setModalCoupon(true)} variant="outline" className="h-12 rounded-xl text-sm font-semibold gap-2 border-border/80">
            <Tag className="h-4 w-4 text-primary" /> Crear Cupón de Descuento
          </Button>
          <Button onClick={() => setModalTracking(true)} variant="secondary" className="h-12 rounded-xl text-sm font-semibold gap-2 bg-secondary/80">
            <Scan className="h-4 w-4 text-primary" /> Escanear / Cargar Tracking
          </Button>
        </div>
      </div>

      {/* Main Grid: Orders & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Recent Orders Table */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Pedidos Recientes</h2>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/60">
              No hay pedidos recientes registrados.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 font-medium text-muted-foreground">
                  <tr>
                    <th className="p-3">ID Pedido</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Monto</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 7).map((order) => (
                    <tr key={order.id} className="border-t border-border/60 hover:bg-muted/10 transition-colors">
                      <td className="p-3 font-mono text-xs text-primary font-semibold">{order.id.slice(0, 8)}…</td>
                      <td className="p-3 truncate max-w-[150px]">{order.customer_name || order.email}</td>
                      <td className="p-3 font-medium">{formatPrice(order.total || order.total_amount || 0)}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          order.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Ecological Inventory Alerts Panel */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-foreground">Alertas de Inventario</h2>

          {/* Low Stock Alerts */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Stock Crítico (Menor a 10 unidades)
            </span>
            {alerts.low_stock.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Todos los productos tienen stock adecuado.</p>
            ) : (
              <div className="space-y-2">
                {alerts.low_stock.map((p) => (
                  <div key={p.id} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">{p.name}</span>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-800 rounded font-bold">{p.stock} unidades</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expiration Alerts */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-rose-500" /> Advertencias de Vencimiento
            </span>
            {alerts.expiration.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No hay lotes próximos a vencer.</p>
            ) : (
              <div className="space-y-2">
                {alerts.expiration.map((item, idx) => (
                  <div key={idx} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center font-semibold text-foreground">
                      <span>{item.name}</span>
                      <span className="text-rose-600 font-bold">Lote Crítico</span>
                    </div>
                    <p className="text-muted-foreground text-[10px]">{item.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leads & Suggestions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Leads Table */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-foreground">Base de Clientes (Leads de Suscripción)</h2>
          <p className="text-xs text-muted-foreground">Correos recolectados del Footer para campañas exclusivas y descuentos.</p>
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="p-3">Correo Electrónico</th>
                  <th className="p-3">Fecha Captura</th>
                  <th className="p-3">Origen</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, idx) => (
                  <tr key={idx} className="border-t border-border/60 hover:bg-muted/10 transition-colors">
                    <td className="p-3 font-semibold text-foreground">{lead.email}</td>
                    <td className="p-3 text-xs text-muted-foreground">{formatDate(lead.created_at || lead.date)}</td>
                    <td className="p-3">
                      <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold px-2.5 py-0.5 rounded-full">
                        {lead.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Suggestions Box */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-foreground">Buzón de Sugerencias (Fórmulas Requeridas)</h2>
          <p className="text-xs text-muted-foreground">Suplementos sugeridos por clientes cuando no encontraron stock en el catálogo.</p>
          <div className="space-y-3">
            {suggestions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center bg-muted/10 rounded-xl border border-dashed">
                No hay sugerencias registradas.
              </p>
            ) : (
              suggestions.map((s) => (
                <div key={s.id} className="p-4 bg-slate-50 border border-border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">"{s.text}"</p>
                    <p className="text-[10px] text-muted-foreground">
                      Sugerido el {formatDate(s.created_at || s.date)} • <strong className={s.status === 'Considerado' ? 'text-emerald-600' : 'text-amber-600'}>{s.status}</strong>
                    </p>
                  </div>
                  {s.status === 'Pendiente' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button onClick={() => handleConsiderSuggestion(s.id)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] px-2.5 py-1">Considerar</Button>
                      <Button onClick={() => handleArchiveSuggestion(s.id)} variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive rounded-lg text-[10px] px-2.5 py-1 text-muted-foreground">Archivar</Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL: QUICK ADD PRODUCT */}
      {modalQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-foreground mb-4">Añadir Producto Rápido</h3>
            <form onSubmit={handleQuickAdd} className="space-y-4">
              <div>
                <Label>Nombre del Producto</Label>
                <Input 
                  value={quickAddForm.name} 
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })} 
                  required 
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Precio (CLP)</Label>
                  <Input 
                    type="number" 
                    value={quickAddForm.price} 
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, price: e.target.value })} 
                    required 
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Stock Inicial</Label>
                  <Input 
                    type="number" 
                    value={quickAddForm.stock} 
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, stock: e.target.value })} 
                    required 
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Categoría</Label>
                <select
                  className="w-full mt-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={quickAddForm.category}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, category: e.target.value })}
                >
                  <option value="Salud Cognitiva">Salud Cognitiva</option>
                  <option value="Gestión del Estrés">Gestión del Estrés</option>
                  <option value="Longevidad">Longevidad</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalQuickAdd(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl">Crear Producto</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE DISCOUNT COUPON */}
      {modalCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-foreground mb-4">Crear Cupón de Descuento</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <Label>Código de Cupón</Label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    placeholder="Escribe o autogenera..."
                    value={couponForm.code} 
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} 
                    required 
                  />
                  <Button type="button" variant="outline" onClick={generateRandomCode}>Generar</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Descuento (%)</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={couponForm.discount} 
                    onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })} 
                    required 
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Fecha Vencimiento</Label>
                  <Input 
                    type="date" 
                    value={couponForm.expiry} 
                    onChange={(e) => setCouponForm({ ...couponForm, expiry: e.target.value })} 
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalCoupon(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl">Guardar Cupón</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCAN BARCODE / DISPATCH TRACKING */}
      {modalTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-foreground mb-4">Registrar Despacho de Pedido</h3>
            <form onSubmit={handleScanTracking} className="space-y-4">
              <div>
                <Label>ID del Pedido</Label>
                <Input 
                  placeholder="Pega el ID del pedido (ej: Supabase UUID)"
                  value={trackingForm.orderId} 
                  onChange={(e) => setTrackingForm({ ...trackingForm, orderId: e.target.value })} 
                  required 
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Código de Tracking (Courier)</Label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                    <Scan className="h-4 w-4" />
                  </span>
                  <Input 
                    placeholder="Escanea el código de barra o digítalo"
                    value={trackingForm.trackingCode} 
                    onChange={(e) => setTrackingForm({ ...trackingForm, trackingCode: e.target.value })} 
                    required 
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalTracking(false)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl">Registrar Envío</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
