import React, { useState, useEffect } from 'react';
import adminClient from '@/lib/adminClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'cancelled', 'expired'];

const formatPrice = (price) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await adminClient.getOrders(filter === 'all' ? null : filter);
      setOrders(data);
    } catch (err) {
      toast.error(err.message);
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
      toast.success('Estado actualizado');
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Filtrar:</span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchOrders}>Actualizar</Button>
      </div>

      {orders.length === 0 ? (
        <p className="text-muted-foreground">No hay órdenes.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Total</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}…</td>
                  <td className="p-3">{order.customer_name}<br /><span className="text-muted-foreground text-xs">{order.email}</span></td>
                  <td className="p-3">{formatPrice(order.total)}</td>
                  <td className="p-3">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">{order.status}</span>
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(order.created_at || order.created).toLocaleDateString('es-CL')}</td>
                  <td className="p-3">
                    <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
