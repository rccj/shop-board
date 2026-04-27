import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCart } from '../useCart'
import { useCartStore } from '@/store/cartStore'

vi.mock('@/api/cart', () => ({
  calculateCartApi: vi.fn(),
}))

import { calculateCartApi } from '@/api/cart'

const mockResult = {
  originalTotal: 2000,
  finalTotal: 1800,
  totalSaved: 200,
  appliedDiscount: 'full_amount' as const,
  discounts: [],
}

beforeEach(() => {
  useCartStore.setState({ items: [] })
  vi.clearAllMocks()
})

describe('useCart — initial state', () => {
  it('starts with empty items', () => {
    const { result } = renderHook(() => useCart())
    expect(result.current.items).toEqual([])
  })

  it('starts with null result', () => {
    const { result } = renderHook(() => useCart())
    expect(result.current.result).toBeNull()
  })

  it('starts with isLoading false', () => {
    const { result } = renderHook(() => useCart())
    expect(result.current.isLoading).toBe(false)
  })

  it('starts with null error', () => {
    const { result } = renderHook(() => useCart())
    expect(result.current.error).toBeNull()
  })
})

describe('useCart — calculate()', () => {
  it('does nothing when cart is empty', async () => {
    const { result } = renderHook(() => useCart())
    await act(async () => { await result.current.calculate() })
    expect(calculateCartApi).not.toHaveBeenCalled()
    expect(result.current.result).toBeNull()
  })

  it('calls calculateCartApi with current items', async () => {
    useCartStore.setState({ items: [{ productId: 1, quantity: 2 }] })
    vi.mocked(calculateCartApi).mockResolvedValue({ data: mockResult })

    const { result } = renderHook(() => useCart())
    await act(async () => { await result.current.calculate() })

    expect(calculateCartApi).toHaveBeenCalledWith([{ productId: 1, quantity: 2 }])
  })

  it('sets result from API response', async () => {
    useCartStore.setState({ items: [{ productId: 1, quantity: 1 }] })
    vi.mocked(calculateCartApi).mockResolvedValue({ data: mockResult })

    const { result } = renderHook(() => useCart())
    await act(async () => { await result.current.calculate() })

    expect(result.current.result).toEqual(mockResult)
  })

  it('sets isLoading true during call, false after', async () => {
    useCartStore.setState({ items: [{ productId: 1, quantity: 1 }] })
    let resolve!: (v: { data: typeof mockResult }) => void
    vi.mocked(calculateCartApi).mockReturnValue(new Promise(res => { resolve = res }))

    const { result } = renderHook(() => useCart())

    act(() => { void result.current.calculate() })
    expect(result.current.isLoading).toBe(true)

    await act(async () => { resolve({ data: mockResult }) })
    expect(result.current.isLoading).toBe(false)
  })

  it('sets error when API throws', async () => {
    useCartStore.setState({ items: [{ productId: 1, quantity: 1 }] })
    vi.mocked(calculateCartApi).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useCart())
    await act(async () => { await result.current.calculate() })

    expect(result.current.error).toBe('計算折扣失敗')
    expect(result.current.result).toBeNull()
  })

  it('isLoading resets to false on error', async () => {
    useCartStore.setState({ items: [{ productId: 1, quantity: 1 }] })
    vi.mocked(calculateCartApi).mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useCart())
    await act(async () => { await result.current.calculate() })

    expect(result.current.isLoading).toBe(false)
  })

  it('clears error on subsequent successful call', async () => {
    useCartStore.setState({ items: [{ productId: 1, quantity: 1 }] })
    vi.mocked(calculateCartApi)
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue({ data: mockResult })

    const { result } = renderHook(() => useCart())
    await act(async () => { await result.current.calculate() })
    expect(result.current.error).toBe('計算折扣失敗')

    await act(async () => { await result.current.calculate() })
    expect(result.current.error).toBeNull()
    expect(result.current.result).toEqual(mockResult)
  })

  it('multiple items all passed to API', async () => {
    useCartStore.setState({
      items: [
        { productId: 1, quantity: 2 },
        { productId: 5, quantity: 1 },
        { productId: 9, quantity: 3 },
      ],
    })
    vi.mocked(calculateCartApi).mockResolvedValue({ data: mockResult })

    const { result } = renderHook(() => useCart())
    await act(async () => { await result.current.calculate() })

    expect(calculateCartApi).toHaveBeenCalledWith([
      { productId: 1, quantity: 2 },
      { productId: 5, quantity: 1 },
      { productId: 9, quantity: 3 },
    ])
  })

  it('result resets to null when cart emptied', async () => {
    useCartStore.setState({ items: [{ productId: 1, quantity: 1 }] })
    vi.mocked(calculateCartApi).mockResolvedValue({ data: mockResult })

    const { result } = renderHook(() => useCart())
    await act(async () => { await result.current.calculate() })
    expect(result.current.result).toEqual(mockResult)

    // Empty the cart and recalculate
    act(() => { result.current.clearCart() })
    await act(async () => { await result.current.calculate() })
    expect(result.current.result).toBeNull()
  })
})

describe('useCart — cart mutations', () => {
  it('addItem adds product', () => {
    const { result } = renderHook(() => useCart())
    act(() => { result.current.addItem(1) })
    expect(result.current.items).toEqual([{ productId: 1, quantity: 1 }])
  })

  it('addItem with qty adds correct amount', () => {
    const { result } = renderHook(() => useCart())
    act(() => { result.current.addItem(1, 3) })
    expect(result.current.items[0].quantity).toBe(3)
  })

  it('addItem with qty=0 adds item with quantity 0', () => {
    const { result } = renderHook(() => useCart())
    act(() => { result.current.addItem(1, 0) })
    expect(result.current.items[0].quantity).toBe(0)
  })

  it('addItem accumulates on repeated calls', () => {
    const { result } = renderHook(() => useCart())
    act(() => { result.current.addItem(1) })
    act(() => { result.current.addItem(1) })
    expect(result.current.items[0].quantity).toBe(2)
  })

  it('removeItem removes correct product', () => {
    useCartStore.setState({ items: [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 1 }] })
    const { result } = renderHook(() => useCart())
    act(() => { result.current.removeItem(1) })
    expect(result.current.items).toEqual([{ productId: 2, quantity: 1 }])
  })

  it('removeItem on non-existent product is a no-op', () => {
    useCartStore.setState({ items: [{ productId: 1, quantity: 1 }] })
    const { result } = renderHook(() => useCart())
    act(() => { result.current.removeItem(999) })
    expect(result.current.items).toHaveLength(1)
  })

  it('updateQuantity changes quantity', () => {
    useCartStore.setState({ items: [{ productId: 1, quantity: 1 }] })
    const { result } = renderHook(() => useCart())
    act(() => { result.current.updateQuantity(1, 7) })
    expect(result.current.items[0].quantity).toBe(7)
  })

  it('updateQuantity to 0 removes item', () => {
    useCartStore.setState({ items: [{ productId: 1, quantity: 2 }] })
    const { result } = renderHook(() => useCart())
    act(() => { result.current.updateQuantity(1, 0) })
    expect(result.current.items).toHaveLength(0)
  })

  it('clearCart empties all items', () => {
    useCartStore.setState({
      items: [
        { productId: 1, quantity: 1 },
        { productId: 2, quantity: 3 },
      ],
    })
    const { result } = renderHook(() => useCart())
    act(() => { result.current.clearCart() })
    expect(result.current.items).toHaveLength(0)
  })
})
