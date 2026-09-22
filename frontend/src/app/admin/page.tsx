'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '@/services/api';
import styles from './dashboard.module.css';

type DashboardData = {
  period_days: number;
  revenue: number;
  orders: number;
  confirmed_orders: number;
  pending_orders: number;
  average_ticket: number;
  active_products: number;
  sales: { date: string; total: number }[];
  recent_orders: {
    id: number;
    created_at: string;
    status: string;
    total_price: number;
    client_name?: string;
    client_email?: string;
  }[];
  low_stock: { id: number; name: string; stock: number }[];
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const money = (value: number) => value.toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.get(`/admin/dashboard/?days=${days}`);
      setData(result);
    } catch (err) {
      setError('Não foi possível carregar as métricas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading && !data) {
    return <div className={styles.empty}>Carregando métricas...</div>;
  }

  if (error && !data) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!data) return null;

  const maxSale = Math.max(...data.sales.map((sale) => sale.total), 1);
  const visibleSales = data.sales.length > 14
    ? data.sales.filter((_, index) => index % Math.ceil(data.sales.length / 14) === 0)
    : data.sales;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1>Dashboard</h1>
          <p>Visão operacional da sua loja.</p>
        </div>
        <div className={styles.controls}>
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} aria-label="Período das métricas">
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
          <button className={styles.refreshButton} onClick={fetchDashboard} title="Atualizar métricas" aria-label="Atualizar métricas">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.kpiGrid}>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Receita confirmada</span>
          <strong className={styles.kpiValue}>{money(data.revenue)}</strong>
          <span className={styles.kpiHint}>Pedidos pagos, enviados ou entregues</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Pedidos no período</span>
          <strong className={styles.kpiValue}>{data.orders}</strong>
          <span className={styles.kpiHint}>{data.confirmed_orders} com pagamento confirmado</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Aguardando pagamento</span>
          <strong className={styles.kpiValue}>{data.pending_orders}</strong>
          <span className={styles.kpiHint}>Requerem acompanhamento</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Ticket médio</span>
          <strong className={styles.kpiValue}>{money(data.average_ticket)}</strong>
          <span className={styles.kpiHint}>{data.active_products} produtos ativos</span>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.panel}>
          <h2>Vendas confirmadas</h2>
          <div className={styles.chart} aria-label={`Vendas dos últimos ${days} dias`}>
            {visibleSales.map((sale) => (
              <div className={styles.barColumn} key={sale.date} title={`${sale.date}: ${money(sale.total)}`}>
                <div className={styles.bar} style={{ height: `${Math.max((sale.total / maxSale) * 180, sale.total ? 3 : 0)}px` }} />
                <span className={styles.barLabel}>{new Date(`${sale.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <h2>Alertas de estoque</h2>
          {data.low_stock.length === 0 ? (
            <p className={styles.orderMeta}>Nenhum produto em nível crítico.</p>
          ) : (
            <div className={styles.alertList}>
              {data.low_stock.map((product) => (
                <div className={styles.alert} key={product.id}>
                  <div>
                    <div className={styles.alertTitle}>{product.name}</div>
                    <div className={`${styles.alertMeta} ${styles.lowStock}`}><AlertTriangle size={12} /> Estoque baixo</div>
                  </div>
                  <strong>{product.stock} un.</strong>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/products" className={styles.orderMeta}>Ver produtos <ArrowRight size={13} /></Link>
        </section>

        <section className={styles.panel}>
          <h2>Pedidos recentes</h2>
          {data.recent_orders.length === 0 ? (
            <p className={styles.orderMeta}>Nenhum pedido encontrado.</p>
          ) : (
            <div className={styles.orderList}>
              {data.recent_orders.map((order) => (
                <div className={styles.order} key={order.id}>
                  <div>
                    <div className={styles.orderTitle}>Pedido #{order.id}</div>
                    <div className={styles.orderMeta}>{order.client_name || order.client_email || 'Cliente não identificado'} · {new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div className={styles.orderValue}>
                    {money(order.total_price)}
                    <span className={styles.status}>{statusLabels[order.status] || order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/orders" className={styles.orderMeta}>Ver todos os pedidos <ArrowRight size={13} /></Link>
        </section>
      </div>
    </div>
  );
}
