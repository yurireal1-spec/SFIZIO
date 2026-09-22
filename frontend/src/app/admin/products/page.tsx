'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';

import { formatCurrency } from '@/utils/format';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await api.get('/products/');
      setProducts(data.items || []);
    } catch (err) {
      console.error('Error fetching products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Erro ao excluir produto');
    }
  };

  return (
    <div>
      <div className="admin-actions">
        <h1>Produtos</h1>
        <Link href="/admin/products/new" className="btn-primary">+ Novo Produto</Link>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Produto</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Carregando...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6}>Nenhum produto encontrado.</td></tr>
            ) : products.map(product => (
              <tr key={product.id}>
                <td>#{product.id}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#eee', borderRadius: '4px' }}>
                        {product.images?.[0] && <img src={product.images[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{product.name}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{product.slug}</div>
                    </div>
                  </div>
                </td>
                <td>{formatCurrency(product.price)}</td>
                <td>{product.stock} un</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    background: product.is_active ? '#e6f4ea' : '#fce8e6',
                    color: product.is_active ? '#1e7e34' : '#d93025'
                  }}>
                    {product.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Link 
                    href={`/admin/products/${product.id}/edit`}
                    style={{ fontSize: '13px', color: '#333', textDecoration: 'none', marginRight: '16px', fontWeight: 600 }}
                  >
                    Editar
                  </Link>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    style={{ background: 'none', border: 'none', color: '#d93025', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
