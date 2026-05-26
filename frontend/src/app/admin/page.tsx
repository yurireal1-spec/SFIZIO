'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    settings: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, orders, settings] = await Promise.all([
           api.get('/products/?limit=1'),
           api.get('/orders/'),
           api.get('/cms/')
        ]);
        
        const totalRev = orders.reduce((acc: number, order: any) => acc + order.total_price, 0);

        setStats({
          products: productsData.total || 0,
          orders: orders.length,
          revenue: totalRev,
          settings: settings.length
        });
        
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
         // API might not be fully seeded
      }
    };
    fetchData();
  }, []);

  // Mock data for a sleek CSS bar chart 
  const chartData = [4000, 3000, 2000, 2780, 1890, 2390, 3490];
  const maxVal = Math.max(...chartData);

  return (
    <div>
      <h1 style={{ marginBottom: '32px' }}>Dashboard Overview</h1>
      
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
           <div className="stat-title">Receita Total</div>
           <div className="stat-value" style={{ color: '#111' }}>R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Produtos Ativos</div>
          <div className="stat-value">{stats.products}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Pedidos Totais</div>
          <div className="stat-value">{stats.orders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Configurações Site</div>
          <div className="stat-value">{stats.settings}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
         <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #eee' }}>
            <h3 style={{ marginBottom: '24px' }}>Evolução de Vendas (Simulação)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '16px', opacity: 0.8 }}>
               {chartData.map((val, idx) => (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                     <div style={{ color: '#aaa', fontSize: '11px' }}>R${val}</div>
                     <div style={{ 
                        width: '100%', 
                        height: `${(val / maxVal) * 150}px`, 
                        backgroundColor: '#111', 
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease'
                     }}></div>
                  </div>
               ))}
            </div>
         </div>

         <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #eee' }}>
            <h3 style={{ marginBottom: '24px' }}>Últimos Pedidos</h3>
            {recentOrders.length === 0 ? (
               <p style={{ color: '#666', fontSize: '13px' }}>Nenhum pedido foi realizado ainda.</p>
            ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {recentOrders.map(order => (
                     <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #fafafa', paddingBottom: '8px' }}>
                        <div>
                           <div style={{ fontWeight: 600, fontSize: '14px' }}>Pedido #{order.id}</div>
                           <div style={{ fontSize: '12px', color: '#888' }}>{new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                           <div style={{ fontWeight: 600, fontSize: '13px' }}>R$ {order.total_price.toLocaleString('pt-BR')}</div>
                           <div style={{ fontSize: '11px', color: order.status === 'paid' ? '#2ecc71' : '#888', textTransform: 'uppercase' }}>{order.status}</div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
