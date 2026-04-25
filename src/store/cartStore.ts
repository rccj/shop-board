import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem } from '@/types/discount'

interface CartStoreState {
  items: CartItem[]
  addItem: (productId: number, qty?: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (productId, qty = 1) =>
        set(state => {
          const existing = state.items.find(i => i.productId === productId)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.productId === productId
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            }
          }
          return { items: [...state.items, { productId, quantity: qty }] }
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
    }),
    { name: 'cart-storage' }
  )
)
