"use client";

import React from 'react';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import styles from './ProductCard.module.css';
import { formatCurrency } from '@/utils/format';

interface ProductCardProps {
  product: Product;
  hidePrice?: boolean;
  showOptions?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
    product, 
    hidePrice = false, 
    showOptions = false 
}) => {
  const addItem = useCartStore((state) => state.addItem);
  const primaryImage = product.images?.find(img => img.is_primary)?.url || product.images?.[0]?.url;

  return (
    <div className={styles.card}>
      <Link href={`/products/${product.slug}`} className={styles.linkWrapper}>
        <div className={styles.imageContainer}>
          {/* Usamos placeholder por enquanto, mas preparado para Next/Image */}
          <div 
            className={styles.image} 
            style={{ backgroundImage: primaryImage ? `url('${primaryImage}')` : 'none' }}
          />
          <div className={styles.overlay}>
             {/* O botão fica fora do Link principal ou com stopPropagation se necessário, mas aqui vamos deixar o link na imagem toda */}
          </div>
        </div>
      </Link>
      <div className={styles.info}>
        <div className={styles.metaRow}>
            <span className={styles.category}>{product.category.name}</span>
            {showOptions && product.options && (
                <div className={styles.optionDots}>
                    {product.options[0]?.values.map(val => (
                        val.meta?.startsWith('#') && (
                            <span 
                                key={val.id} 
                                className={styles.dot} 
                                style={{ backgroundColor: val.meta }} 
                                title={val.name}
                            />
                        )
                    ))}
                </div>
            )}
        </div>
        
        <Link href={`/products/${product.slug}`}>
          <h3 className={styles.name}>{product.name}</h3>
        </Link>

        {!hidePrice && (
            <div className={styles.priceContainer}>
              {product.discount_price ? (
                <>
                  <span className={styles.oldPrice}>{formatCurrency(product.price)}</span>
                  <span className={styles.price}>{formatCurrency(product.discount_price)}</span>
                </>
              ) : (
                <span className={styles.price}>{formatCurrency(product.price)}</span>
              )}
            </div>
        )}

        <button className={styles.addToCartInline} onClick={() => addItem(product, {})} disabled={product.stock <= 0}>
          <ShoppingBag size={16} />
          <span>{product.stock > 0 ? 'Adicionar' : 'Sem estoque'}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
