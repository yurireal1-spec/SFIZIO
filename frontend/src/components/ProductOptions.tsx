"use client";

import React from 'react';
import { ProductOption, ProductOptionValue } from '@/types';
import styles from './ProductOptions.module.css';

interface ProductOptionsProps {
  options: ProductOption[];
  selectedValues: Record<number, number>; // optionId -> valueId
  onSelect: (optionId: number, valueId: number) => void;
}

const ProductOptions: React.FC<ProductOptionsProps> = ({ options, selectedValues, onSelect }) => {
  return (
    <div className={styles.container}>
      {options.map((option) => (
        <div key={option.id} className={styles.optionGroup}>
          <div className={styles.header}>
            <span className={styles.optionName}>{option.name}</span>
            <span className={styles.selectedValueName}>
              {option.values.find(v => v.id === selectedValues[option.id])?.name || 'Selecione'}
            </span>
          </div>
          <div className={styles.valuesGrid}>
            {option.values.map((value) => {
              const isActive = selectedValues[option.id] === value.id;
              const isColor = value.meta?.startsWith('#');

              return (
                <button
                  key={value.id}
                  className={`${styles.valueItem} ${isActive ? styles.active : ''}`}
                  onClick={() => onSelect(option.id, value.id)}
                  title={value.name}
                >
                  {isColor ? (
                    <div 
                      className={styles.colorSwatch} 
                      style={{ backgroundColor: value.meta }}
                    />
                  ) : (
                    <span className={styles.textValue}>{value.name}</span>
                  )}
                  {isActive && <div className={styles.activeDot} />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductOptions;
