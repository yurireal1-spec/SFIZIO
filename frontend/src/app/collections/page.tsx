"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import styles from './page.module.css';

export default function CollectionsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.get('/products/categories/');
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return <main className={styles.wrapper}><div className={styles.container}><p>Carregando coleções...</p></div></main>;
  }

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
            <h1 className={styles.title}>Coleções</h1>
            <p className={styles.subtitle}>
                Uma curadoria meticulosa de peças autorais que definem novos clássicos do mobiliário contemporâneo.
            </p>
        </div>

        <div className={styles.collectionsGrid}>
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={`/collections/${category.slug}`}
              className={styles.collectionCard}
            >
              <div 
                className={styles.cardBg} 
                style={{ backgroundImage: `url('${category.image_url || '/placeholder-furniture.jpg'}')` }}
              />
              <div className={styles.overlay} />
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{category.name}</h2>
                <p className={styles.cardDesc}>{category.description}</p>
                <span className={styles.exploreBtn}>Explorar Peças</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
