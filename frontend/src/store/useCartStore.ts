import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface CartItem {
  product: Product;
  selectedOptions: Record<number, number>;
  quantity: number;
  unitPrice: number;
}

interface CartStore {
  items: CartItem[];
  isCartOpen: boolean;
  addItem: (product: Product, selectedOptions: Record<number, number>) => void;
  removeItem: (uniqueKey: string) => void;
  updateQuantity: (uniqueKey: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// Auxiliar para criar chave única baseada no produto e opções
const getUniqueKey = (productId: number, options: Record<number, number>) => {
  return `${productId}-${JSON.stringify(Object.entries(options || {}).sort())}`;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      addItem: (product, selectedOptions) => {
        const currentItems = get().items;
        const entryKey = getUniqueKey(product.id, selectedOptions);
        
        const existingItem = currentItems.find(item => 
            getUniqueKey(item.product.id, item.selectedOptions) === entryKey
        );
        
        // Calcular o unitPrice correto incluindo os modificadores
        const basePrice = product.discount_price || product.price;
        const modifiers = Object.entries(selectedOptions || {}).reduce((acc, [optIdStr, valId]) => {
          const optId = parseInt(optIdStr);
          const opt = product.options?.find(o => o.id === optId);
          const val = opt?.values?.find(v => v.id === valId);
          return acc + (val?.price_modifier || 0);
        }, 0);
        const unitPrice = basePrice + modifiers;

        if (existingItem) {
          set({
            items: currentItems.map(item => 
              getUniqueKey(item.product.id, item.selectedOptions) === entryKey
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
            isCartOpen: true
          });
        } else {
          set({ 
            items: [...currentItems, { product, selectedOptions, quantity: 1, unitPrice }],
            isCartOpen: true
          });
        }
      },
      
      removeItem: (uniqueKey) => {
        set({
          items: get().items.filter(item => 
            getUniqueKey(item.product.id, item.selectedOptions) !== uniqueKey
          )
        });
      },
      
      updateQuantity: (uniqueKey, quantity) => {
        if (quantity <= 0) {
          get().removeItem(uniqueKey);
          return;
        }
        set({
          items: get().items.map(item => 
            getUniqueKey(item.product.id, item.selectedOptions) === uniqueKey 
                ? { ...item, quantity } 
                : item
          )
        });
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          return total + (item.unitPrice * item.quantity);
        }, 0);
      }
    }),
    {
      name: 'sfizio-cart-storage',
    }
  )
);
