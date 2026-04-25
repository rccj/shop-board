import { useState, useCallback } from 'react'
import { useCartStore } from '@/store/cartStore'
import { calculateCartApi } from '@/api/cart'
import { CalculationResult } from '@/types/discount'

export function useCart() {
  const { items, addItem, removeItem, updateQuantity, clearCart } = useCartStore()
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = useCallback(async () => {
    if (items.length === 0) {
      setResult(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await calculateCartApi(items)
      setResult(res.data)
    } catch {
      setError('計算折扣失敗')
    } finally {
      setIsLoading(false)
    }
  }, [items])

  return {
    items,
    result,
    isLoading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    calculate,
  }
}
