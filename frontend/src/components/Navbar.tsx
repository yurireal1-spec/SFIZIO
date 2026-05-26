"use client";

import React, { useEffect, useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { ShoppingBag, User, Search, Menu } from 'lucide-react';
import Link from 'next/link';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const openCart = useCartStore((state) => state.openCart);
  
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  
  // Evitar erros de hidratação com Zustand persist persist
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="glass-nav">
      <div className={styles.container}>
        <div className={styles.left}>
            <Menu className={styles.mobileOnly} />
            <div className={styles.links}>
                <Link href="/collections">Coleções</Link>
                <a href="#">Showroom</a>
            </div>
        </div>

        <div className={styles.logo}>SFIZIO</div>

        <div className={styles.right}>
          <div className={styles.iconGroup}>
            <Search size={20} className={styles.desktopOnly} />
            <User size={20} className={styles.desktopOnly} />
            <div className={styles.cartIcon} onClick={openCart}>
                <ShoppingBag size={20} />
                {mounted && totalItems > 0 && (
                    <span className={styles.badge}>{totalItems}</span>
                )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
