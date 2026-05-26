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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cats = await api.get('/products/categories/');
        const foundCat = cats.find((c: any) => c.slug === slug);
        
        if (foundCat) {
          setCategory(foundCat);
          const prodsData = await api.get(`/products/?category_id=${foundCat.id}&limit=100`);
          setProducts(prodsData.items || []);
        }
      } catch (err) {
        console.error('Error fetching category data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchData();
  }, [slug]);

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

        <div className={styles.productGrid}>
          {products.map((product) => (
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
