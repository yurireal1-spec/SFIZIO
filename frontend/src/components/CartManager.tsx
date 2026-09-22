"use client";

import React from 'react';
import { useCartStore } from '@/store/useCartStore';
import CartDrawer from './CartDrawer';

const CartManager = () => {
  const { isCartOpen, closeCart } = useCartStore();

  return (
    <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
  );
};

export default CartManager;
