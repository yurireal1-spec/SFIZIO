'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: '#888' },
  paid: { label: 'Pago', color: '#2ecc71' },
  shipped: { label: 'Enviado', color: '#f39c12' },
  delivered: { label: 'Entregue', color: '#3498db' },
  cancelled: { label: 'Cancelado', color: '#e74c3c' }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await api.get('/orders/');
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: int, newStatus: string) => {
    try {
      // Optimizistic update
      const previousOrders = [...orders];
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
    } catch (err) {
      alert('Erro ao atualizar o status do pedido');
      fetchOrders(); // rollback on error
    }
  };

  return (
    <div>
      <div className="admin-actions">
        <h1>Gestão de Pedidos</h1>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Nenhum pedido encontrado.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Status</th>
                <th>Endereço</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>Usuário #{order.user_id}</td>
                  <td style={{ fontWeight: 600 }}>R$ {order.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <select 
                      value={order.status} 
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{
                         padding: '4px 8px',
                         borderRadius: '12px',
                         border: `1px solid ${statusMap[order.status]?.color || '#ccc'}`,
                         color: statusMap[order.status]?.color || '#333',
                         backgroundColor: 'transparent',
                         fontWeight: 600,
                         fontSize: '0.8rem',
                         cursor: 'pointer'
                      }}
                    >
                      {Object.keys(statusMap).map(key => (
                        <option key={key} value={key}>{statusMap[key].label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.shipping_address}>
                    {order.shipping_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
