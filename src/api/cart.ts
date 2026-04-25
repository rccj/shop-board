import { CartItem, CalculationResult } from '@/types/discount'
import { Product as DiscountProduct } from '@/types/discount'
import { Product } from '@/types/product'
import { calculateCart } from '@/lib/discount'

const delay = (ms = 400) =>
  new Promise(res => setTimeout(res, ms + Math.random() * 200))

const CATEGORY_MAP: Record<number, DiscountProduct['category']> = {
  1: 'electronics',
  2: 'clothing',
  6: 'books',
}

const getRealProducts = (): Product[] => {
  const stored = localStorage.getItem('mock_products')
  if (!stored) return []
  return JSON.parse(stored) as Product[]
}

export const calculateCartApi = async (
  cart: CartItem[]
): Promise<{ data: CalculationResult }> => {
  await delay()
  const allProducts = getRealProducts()

  const discountProducts: DiscountProduct[] = cart
    .flatMap(item => {
      const p = allProducts.find(p => p.id === item.productId)
      if (!p) return []
      return [{
        id: p.id,
        name: p.name,
        price: p.price,
        category: (CATEGORY_MAP[p.category.id] ?? 'other') as DiscountProduct['category'],
      }]
    })

  const filteredCart = cart.filter(item =>
    discountProducts.some(p => p.id === item.productId)
  )

  const result = calculateCart(filteredCart, discountProducts)
  return { data: result }
}

export const getCartProducts = (productIds: number[]): Product[] => {
  const allProducts = getRealProducts()
  return productIds.flatMap(id => {
    const p = allProducts.find(p => p.id === id)
    return p ? [p] : []
  })
}
