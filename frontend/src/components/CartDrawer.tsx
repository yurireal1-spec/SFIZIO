"use client";

import React from 'react';
import { useCartStore } from '@/store/useCartStore';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import styles from './CartDrawer.module.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleCheckout = () => {
    onClose();
    window.location.href = '/checkout';
  };

  if (!isOpen) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2>Sua Sacola</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>

        <div className={styles.content}>
          {isSuccess ? (
            <div className={styles.success}>
              <h2>Pedido Confirmado</h2>
              <p>Obrigado por escolher a SFIZIO. <br /> Seu pedido está sendo processado.</p>
            </div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>
              <ShoppingBag size={48} strokeWidth={1} />
              <p>Sua sacola está vazia</p>
              <button onClick={onClose} className={styles.continueButton}>Continuar Comprando</button>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {items.map((item) => {
                const uniqueKey = `${item.product.id}-${JSON.stringify(Object.entries(item.selectedOptions || {}).sort())}`;
                
                return (
                  <div key={uniqueKey} className={styles.cartItem}>
                    <div className={styles.itemImg} style={{ backgroundImage: `url(${item.product.images[0]?.url})` }} />
                    <div className={styles.itemInfo}>
                      <h3>{item.product.name}</h3>
                      <div className={styles.selectedOptions}>
                        {Object.entries(item.selectedOptions || {}).map(([optId, valId]) => {
                          const option = item.product.options.find(o => o.id === parseInt(optId));
                          const value = option?.values.find(v => v.id === valId);
                          return value ? <span key={optId}>{option?.name}: {value.name}</span> : null;
                        })}
                      </div>
                      <p className={styles.itemPrice}>R$ {(item.product.discount_price || item.product.price).toLocaleString('pt-BR')}</p>
                      <div className={styles.quantity}>
                        <button onClick={() => updateQuantity(uniqueKey, item.quantity - 1)}><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(uniqueKey, item.quantity + 1)}><Plus size={14} /></button>
                      </div>
                    </div>
                    <button className={styles.remove} onClick={() => removeItem(uniqueKey)}>Remover</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!isSuccess && items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>R$ {getTotalPrice().toLocaleString('pt-BR')}</span>
            </div>
            <p className={styles.shippingInfo}>Frete calculado no próximo passo.</p>
            <button 
              className={styles.checkoutButton}
              onClick={handleCheckout}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? 'Processando...' : 'Finalizar Compra'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
