import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../cartStore'

beforeEach(() => {
  useCartStore.setState({ items: [] })
})

describe('cartStore', () => {
  it('addItem adds new item with quantity 1', () => {
    useCartStore.getState().addItem(1)
    expect(useCartStore.getState().items).toEqual([{ productId: 1, quantity: 1 }])
  })

  it('addItem increments quantity for existing item', () => {
    useCartStore.getState().addItem(1)
    useCartStore.getState().addItem(1)
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })

  it('addItem supports custom qty', () => {
    useCartStore.getState().addItem(1, 3)
    expect(useCartStore.getState().items[0].quantity).toBe(3)
  })

  it('addItem adds to existing qty when called with qty param', () => {
    useCartStore.getState().addItem(1, 2)
    useCartStore.getState().addItem(1, 3)
    expect(useCartStore.getState().items[0].quantity).toBe(5)
  })

  it('removeItem removes the product', () => {
    useCartStore.getState().addItem(1)
    useCartStore.getState().addItem(2)
    useCartStore.getState().removeItem(1)
    expect(useCartStore.getState().items).toEqual([{ productId: 2, quantity: 1 }])
  })

  it('updateQuantity updates quantity', () => {
    useCartStore.getState().addItem(1)
    useCartStore.getState().updateQuantity(1, 5)
    expect(useCartStore.getState().items[0].quantity).toBe(5)
  })

  it('updateQuantity with 0 removes item', () => {
    useCartStore.getState().addItem(1)
    useCartStore.getState().updateQuantity(1, 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('clearCart empties all items', () => {
    useCartStore.getState().addItem(1)
    useCartStore.getState().addItem(2)
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('updateQuantity on non-existent productId is a no-op', () => {
    useCartStore.getState().addItem(1)
    useCartStore.getState().updateQuantity(999, 5)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].quantity).toBe(1)
  })

  it('removeItem on empty cart stays empty', () => {
    useCartStore.getState().removeItem(1)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('multiple products tracked independently', () => {
    useCartStore.getState().addItem(1, 2)
    useCartStore.getState().addItem(2, 1)
    useCartStore.getState().addItem(3, 5)
    expect(useCartStore.getState().items).toHaveLength(3)
    expect(useCartStore.getState().items.find(i => i.productId === 3)?.quantity).toBe(5)
  })
})
