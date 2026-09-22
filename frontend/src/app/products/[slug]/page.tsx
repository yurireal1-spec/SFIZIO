"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { ShoppingBag, ChevronLeft, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import ProductOptions from '@/components/ProductOptions';
import styles from './page.module.css';
import { api } from '@/services/api';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const addItem = useCartStore((state) => state.addItem);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [variantImageOverride, setVariantImageOverride] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const found = await api.get(`/products/${slug}`);
        if (found) {
          setProduct(found);
          
          const initial: Record<number, number> = {};
          found.options?.forEach((opt: any) => {
            if (opt.values?.length > 0) initial[opt.id] = opt.values[0].id;
          });
          setSelectedOptions(initial);
        }
      } catch (err) {
        console.error('Produto não encontrado:', err);
      }
    };
    if (slug) fetchProduct();
  }, [slug]);

  if (!product) {
    return (
      <div className={styles.loading}>
        <p>Carregando peça exclusiva...</p>
      </div>
    );
  }

  const primaryImage = product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url;
  const currentImage = variantImageOverride || product.images?.[activeImageIndex]?.url || primaryImage;

  // Cálculo de Preço com Modificadores
  const basePrice = product.discount_price || product.price;
  const modifiers = product.options?.reduce((acc: number, opt: any) => {
    const valId = selectedOptions[opt.id];
    const val = opt.values.find((v: any) => v.id === valId);
    return acc + (val?.price_modifier || 0);
  }, 0) || 0;
  
  const totalPrice = basePrice + modifiers;

  const handleOptionSelect = (optionId: number, valueId: number) => {
    setSelectedOptions(prev => ({ ...prev, [optionId]: valueId }));
    
    // Check if variant has an image_url and override
    const opt = product.options.find((o: any) => o.id === optionId);
    const val = opt?.values.find((v: any) => v.id === valueId);
    if (val?.image_url) {
      setVariantImageOverride(val.image_url);
    }
  };

  const handleThumbnailClick = (idx: number) => {
    setActiveImageIndex(idx);
    setVariantImageOverride(null);
  };

  const handleRequestQuote = () => {
    const number = "5511999999999";
    const selectedText = product.options.map((opt: any) => {
        const valId = selectedOptions[opt.id];
        const val = opt.values.find((v: any) => v.id === valId);
        return `${opt.name}: ${val?.name || 'Não selecionado'}`;
    }).join('\n');

    const message = `Olá! Tenho interesse em uma peça personalizada:\n\n*Produto:* ${product.name}\n*Opções desejadas:*\n${selectedText}\n\n*Valor base:* R$ ${totalPrice.toLocaleString('pt-BR')}\n\nGostaria de mais detalhes sobre o prazo e frete.`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${number}?text=${encodedMessage}`, '_blank');
  };

  return (
    <main className={styles.wrapper}>
      {/* Breadcrumbs / Back */}
      <div className={styles.navigation}>
        <Link href="/" className={styles.backLink}>
          <ChevronLeft size={18} />
          <span>Voltar para Coleção</span>
        </Link>
      </div>

      <div className={styles.container}>
        {/* Left: Image Gallery */}
        <div className={styles.gallery}>
          <div 
            className={styles.mainImage} 
            style={{ 
              backgroundImage: currentImage ? `url('${currentImage}')` : 'none', 
              height: '500px', 
              width: '100%', 
              backgroundSize: 'contain', 
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center', 
              backgroundColor: '#f8f9fa',
              borderRadius: '12px', 
              transition: 'background-image 0.4s ease-in-out' 
            }}
          />
          
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
               {product.images.map((img: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => handleThumbnailClick(idx)}
                    style={{ 
                       width: '80px', 
                       height: '80px', 
                       borderRadius: '8px', 
                       border: activeImageIndex === idx && !variantImageOverride ? '2px solid var(--accent)' : '2px solid transparent',
                       backgroundImage: `url('${img.url}')`,
                       backgroundSize: 'cover',
                       backgroundPosition: 'center',
                       cursor: 'pointer',
                       flexShrink: 0,
                       transition: 'all 0.2s',
                       opacity: activeImageIndex === idx && !variantImageOverride ? 1 : 0.6
                    }}
                  />
               ))}
            </div>
          )}

          <div className={styles.detailsList} style={{ marginTop: '32px' }}>
             <div className={styles.detailTitle}>Filosofia da Peça</div>
             <p>{product.description}</p>
          </div>
        </div>

        {/* Right: Info Panels */}
        <div className={styles.infoPanel}>
          <div className={styles.stickyContent}>
            <span className={styles.category}>{product.category.name}</span>
            <h1 className={styles.title}>{product.name}</h1>
            
            <div className={styles.priceSection}>
              <div className={styles.priceRow}>
                <span className={styles.price}>R$ {totalPrice.toLocaleString('pt-BR')}</span>
                {product.discount_price && (
                    <span className={styles.oldPrice}>R$ {(product.price + modifiers).toLocaleString('pt-BR')}</span>
                )}
              </div>
              <p className={styles.installments}>ou 10x de R$ {(totalPrice / 10).toLocaleString('pt-BR')}</p>
            </div>

            {/* Selection Options */}
            {product.options && (
              <ProductOptions 
                options={product.options} 
                selectedValues={selectedOptions}
                onSelect={handleOptionSelect}
              />
            )}

            <div className={styles.actions}>
                <button 
                className={styles.addToCart}
                onClick={() => addItem({
                    ...product,
                    price: totalPrice // Passar o preço final com modificadores
                }, selectedOptions)}
                >
                <ShoppingBag size={20} />
                <span>Adicionar à Sacola</span>
                </button>

                <button 
                className={styles.requestQuote}
                onClick={handleRequestQuote}
                >
                <span>Solicitar Orçamento</span>
                </button>
            </div>

            {/* Trust Badges */}
            <div className={styles.trustSection}>
              <div className={styles.trustItem}>
                <Truck size={18} />
                <span>Frete Premium Segurado</span>
              </div>
              <div className={styles.trustItem}>
                <ShieldCheck size={18} />
                <span>Garantia Vitalícia de Estrutura</span>
              </div>
              <div className={styles.trustItem}>
                <RefreshCw size={18} />
                <span>Troca Facilitada em 30 Dias</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
