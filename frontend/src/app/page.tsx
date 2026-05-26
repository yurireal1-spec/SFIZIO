'use client';

import React, { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import styles from './page.module.css';
import { api } from '@/services/api';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [hero, setHero] = useState({
    title: "A Essência do Design Atemporal",
    subtitle: "Nova Coleção 2026",
    description: "Móveis assinados que elevam o habitar à categoria de arte. Conheça o novo minimalismo sofisticado da SFIZIO.",
    button_text: "Explorar Coleção",
    image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6"
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsData = await api.get('/products/?limit=4');
        setProducts(productsData.items || []); // Show first 4 on home

        // Fetch hero settings
        const cmsData = await api.get('/cms/hero_content');
        if (cmsData && cmsData.value) {
          setHero(JSON.parse(cmsData.value));
        }
      } catch (err) {
        console.warn('API not fully initialized or reachable. Using default values.');
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroSub}>{hero.subtitle}</p>
          <h1 className={styles.heroTitle}>{hero.title}</h1>
          <p className={styles.heroDesc}>{hero.description}</p>
          <button className={styles.heroButton}>{hero.button_text}</button>
        </div>
        <div className={styles.heroImageWrapper}>
            <div className={styles.heroImageOverlay}></div>
            <div style={{ 
                backgroundColor: '#e2e2e2', 
                width: '100%', 
                height: '100%',
                backgroundImage: `url(${hero.image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}></div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-padding">
        <div className={styles.sectionHeader}>
          <h2>Coleção em Destaque</h2>
          <a href="/collections">Ver Catálogo Completo</a>
        </div>
        <div className="grid-container">
          {products.length > 0 ? products.map(product => (
            <div key={product.id} style={{ gridColumn: 'span 4' }}>
              <ProductCard product={product} />
            </div>
          )) : (
            <p style={{ gridColumn: 'span 12', textAlign: 'center', color: '#888' }}>
              Carregando coleções exclusivas...
            </p>
          )}
        </div>
      </section>

      {/* Philosophy Section */}
      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '100px 5%' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Nossa Filosofia</span>
          <h2 style={{ fontSize: '3rem', margin: '24px 0', lineHeight: 1.1 }}>Curadoria de materiais, rigor no detalhe.</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
            Cada peça SFIZIO é selecionada por sua capacidade de contar uma história através de texturas, 
            formas orgânicas e durabilidade excepcional.
          </p>
        </div>
      </section>
    </div>
  );
}
