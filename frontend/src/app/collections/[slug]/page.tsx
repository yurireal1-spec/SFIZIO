"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import ProductCard from '@/components/ProductCard';
import { ChevronLeft } from 'lucide-react';
import styles from '../page.module.css';

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [inStock, setInStock] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cats = await api.get('/products/categories/');
        const foundCat = cats.find((c: any) => c.slug === slug);
        
        if (foundCat) {
          setCategory(foundCat);
          const params = new URLSearchParams({ category_id: String(foundCat.id), limit: '100' });
          if (search.trim()) params.set('q', search.trim());
          if (inStock) params.set('in_stock', 'true');
          const prodsData = await api.get(`/products/?${params.toString()}`);
          setProducts(prodsData.items || []);
        }
      } catch (err) {
        console.error('Error fetching category data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchData();
  }, [slug, search, inStock]);

  const sortedProducts = [...products].sort((first, second) => {
    if (sort === 'price-asc') return (first.discount_price || first.price) - (second.discount_price || second.price);
    if (sort === 'price-desc') return (second.discount_price || second.price) - (first.discount_price || first.price);
    return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
  });

  if (loading) {
    return <main className={styles.wrapper}><div className={styles.container}><p>Carregando peças...</p></div></main>;
  }

  if (!category) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <p>Coleção não encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        <Link href="/collections" className={styles.backLink}>
          <ChevronLeft size={16} />
          <span>Voltar para Coleções</span>
        </Link>

        <div className={styles.header}>
            <h1 className={styles.title}>{category.name}</h1>
            <p className={styles.subtitle}>{category.description}</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar nesta coleção..."
            aria-label="Buscar nesta coleção"
            style={{ flex: '1 1 280px', minHeight: '44px', padding: '0 14px', border: '1px solid #ddd', background: 'transparent' }}
          />
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Ordenar produtos" style={{ minHeight: '44px', padding: '0 14px', border: '1px solid #ddd', background: 'transparent' }}>
            <option value="newest">Mais recentes</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px' }}>
            <input type="checkbox" checked={inStock} onChange={(event) => setInStock(event.target.checked)} /> Em estoque
          </label>
        </div>

        <div className={styles.productGrid}>
          {sortedProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              hidePrice={false} 
              showOptions={true}
            />
          ))}
        </div>

        {products.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', marginTop: '40px' }}>
                Novas peças desta coleção serão lançadas em breve.
            </p>
        )}
      </div>
    </main>
  );
}
