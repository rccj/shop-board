import { create } from 'zustand'
import { CartItem } from '@/types/discount'

interface CartStoreState {
  items: CartItem[]
  addItem: (productId: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStoreState>(set => ({
  items: [],
  addItem: (productId) =>
    set(state => {
      const existing = state.items.find(i => i.productId === productId)
      if (existing) {
        return {
          items: state.items.map(i =>
            i.productId === productId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }
      return { items: [...state.items, { productId, quantity: 1 }] }
    }),
  removeItem: (productId) =>
    set(state => ({ items: state.items.filter(i => i.productId !== productId) })),
  updateQuantity: (productId, quantity) =>
    set(state => ({
      items:
        quantity <= 0
          ? state.items.filter(i => i.productId !== productId)
          : state.items.map(i =>
              i.productId === productId ? { ...i, quantity } : i
            ),
    })),
  clearCart: () => set({ items: [] }),
}))
