'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';

const statusLabels: Record<string, string> = {
  pending: 'Pendente', paid: 'Pago', shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado',
};

export default function AdminOrderDetail() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params?.id) {
      api.get(`/orders/${params.id}`).then(setOrder).catch(() => setError('Não foi possível carregar o pedido.'));
    }
  }, [params]);

  if (error) return <div className="admin-form">{error}</div>;
  if (!order) return <div className="admin-form">Carregando pedido...</div>;

  return (
    <div>
      <div className="admin-actions">
        <div>
          <Link href="/admin/orders">← Voltar para pedidos</Link>
          <h1>Pedido #{order.id}</h1>
        </div>
        <strong>{statusLabels[order.status] || order.status}</strong>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(260px, 1fr)', gap: '24px' }}>
        <section className="admin-form">
          <h2>Itens do pedido</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            {order.items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
                <div><strong>Produto #{item.product_id}</strong><div style={{ color: '#777', fontSize: '13px' }}>{item.quantity} x R$ {item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
                <strong>R$ {(item.quantity * item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
            ))}
          </div>
          <h2 style={{ textAlign: 'right', marginTop: '24px' }}>Total: R$ {order.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </section>
        <section className="admin-form">
          <h2>Cliente e entrega</h2>
          <dl style={{ lineHeight: 1.8, marginTop: '24px' }}>
            <dt>Nome</dt><dd>{order.client_name || 'Não informado'}</dd>
            <dt>E-mail</dt><dd>{order.client_email || 'Não informado'}</dd>
            <dt>Telefone</dt><dd>{order.client_phone || 'Não informado'}</dd>
            <dt>Endereço</dt><dd>{order.shipping_address}</dd>
            <dt>Data</dt><dd>{new Date(order.created_at).toLocaleString('pt-BR')}</dd>
          </dl>
        </section>
      </div>
    </div>
  );
}
