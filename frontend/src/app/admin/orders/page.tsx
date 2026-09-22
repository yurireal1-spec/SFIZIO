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
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [status, search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search.trim()) params.set('q', search.trim());
      const query = params.toString();
      const data = await api.get(`/orders/${query ? `?${query}` : ''}`);
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
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

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, e-mail ou ID..."
          aria-label="Buscar pedidos"
          style={{ flex: '1 1 280px', minHeight: '42px', padding: '0 12px', border: '1px solid #e1e1e1', borderRadius: '6px' }}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrar por status"
          style={{ minHeight: '42px', padding: '0 12px', border: '1px solid #e1e1e1', borderRadius: '6px', background: '#fff' }}
        >
          <option value="">Todos os status</option>
          {Object.keys(statusMap).map(key => (
            <option key={key} value={key}>{statusMap[key].label}</option>
          ))}
        </select>
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
                  <td><a href={`/admin/orders/${order.id}`}>{new Date(order.created_at).toLocaleDateString('pt-BR')}</a></td>
                  <td>{order.client_name || order.client_email || (order.user_id ? `Usuário #${order.user_id}` : 'Cliente')}</td>
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
