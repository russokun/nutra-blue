import React, { useState, useEffect } from 'react';
import adminClient from '@/lib/adminClient';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { RefreshCw, Filter, Calendar, DollarSign, User, Eye } from 'lucide-react';
import OrderDetailModal from '@/components/OrderDetailModal';

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'cancelled', 'expired'];

const formatPrice = (price) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

const COURIER_LABELS = {
  blue_express: 'Blue Express',
  starken: 'Starken',
  pullman: 'Pullman',
};

const formatDelivery = (order) => {
  if (order.delivery_method === 'retiro_vendedor') return 'Retiro con vendedor';
  if (order.delivery_method === 'retiro_courier') {
    return `Retiro en ${COURIER_LABELS[order.courier] || 'transporte'}`;
  }
  return 'Envío a domicilio';
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  // Modal en vez de ruta propia: asi el filtro y el scroll de la lista no se pierden.
  const [detalleId, setDetalleId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await adminClient.getOrders(filter === 'all' ? null : filter);
      setOrders(data);
    } catch (err) {
      toast.error(err.message || 'Error al obtener órdenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminClient.updateOrderStatus(orderId, newStatus);
      toast.success('Estado del pedido actualizado');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Error al actualizar estado');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
          Gestión de Pedidos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Controla los estados de pago y despacho de tus ventas</p>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card border border-border/60 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Estado:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todas las órdenes</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm" className="rounded-xl gap-2">
          <RefreshCw className="h-4 w-4" /> Refrescar Lista
        </Button>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-card border border-border/60 rounded-2xl shadow-sm">
          <p className="text-muted-foreground text-sm">No se encontraron órdenes con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 font-medium text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="p-4">Código de Pedido</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Entrega</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Estado Actual</th>
                  <th className="p-4 text-right">Modificar Estado</th>
                  <th className="p-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-border/60 hover:bg-muted/5 transition-colors">
                    <td className="p-4 font-mono text-xs text-primary font-bold">{order.id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{order.customer_name || 'Sin nombre'}</div>
                      <div className="text-xs text-muted-foreground">{order.email}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(order.created_at || order.created).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{formatDelivery(order)}</td>
                    <td className="p-4 font-semibold text-foreground">
                      {formatPrice(order.total || order.total_amount || 0)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        order.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        order.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary inline-block text-left"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.toUpperCase()}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        onClick={() => setDetalleId(order.id)}
                        variant="outline"
                        size="sm"
                        className="rounded-lg gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" /> Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <OrderDetailModal orderId={detalleId} onClose={() => setDetalleId(null)} />
    </div>
  );
};

export default OrdersPage;
