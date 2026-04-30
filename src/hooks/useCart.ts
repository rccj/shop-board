import { useState, useCallback, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useCartStore } from '@/store/cartStore'
import { calculateCartApi } from '@/api/cart'
import { CalculationResult } from '@/types/discount'

export function useCart() {
  const { items, addItem, removeItem, updateQuantity, clearCart } = useCartStore(
    useShallow(s => ({
      items: s.items,
      addItem: s.addItem,
      removeItem: s.removeItem,
      updateQuantity: s.updateQuantity,
      clearCart: s.clearCart,
    }))
  )
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const callIdRef = useRef(0)

  const calculate = useCallback(async () => {
    if (items.length === 0) {
      setResult(null)
      return
    }
    const callId = ++callIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      const res = await calculateCartApi(items)
      if (callId !== callIdRef.current) return
      setResult(res.data)
    } catch {
      if (callId !== callIdRef.current) return
      setError('計算折扣失敗')
    } finally {
      if (callId === callIdRef.current) setIsLoading(false)
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
