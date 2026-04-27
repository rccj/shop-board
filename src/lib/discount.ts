import Decimal from 'decimal.js'
import {
  Product,
  CartItem,
  DiscountDetail,
  CalculationResult,
} from '@/types/discount'

interface CartItemWithProduct {
  item: CartItem
  product: Product
}

interface DiscountContext {
  cartItems: CartItemWithProduct[]
  originalTotal: number
}

interface DiscountStrategy {
  name: string
  getRate(item: CartItemWithProduct, context: DiscountContext): number | null
}

class FullAmountStrategy implements DiscountStrategy {
  name = 'full_amount'
  getRate(_item: CartItemWithProduct, context: DiscountContext): number | null {
    return context.originalTotal >= 10000 ? 0.9 : null
  }
}

class CategoryStrategy implements DiscountStrategy {
  name = 'category'
  private thresholds: Record<string, { min: number; rate: number }> = {
    electronics: { min: 2, rate: 0.85 },
    clothing: { min: 3, rate: 0.8 },
    books: { min: 5, rate: 0.7 },
  }

  getRate(item: CartItemWithProduct, context: DiscountContext): number | null {
    const cat = item.product.category
    const threshold = this.thresholds[cat]
    if (!threshold) return null
    const totalQty = context.cartItems
      .filter(i => i.product.category === cat)
      .reduce((sum, i) => sum + i.item.quantity, 0)
    return totalQty >= threshold.min ? threshold.rate : null
  }
}

class SecondItemHalfPriceStrategy implements DiscountStrategy {
  name = 'second_item_half'
  getRate(item: CartItemWithProduct, _context: DiscountContext): number | null {
    const qty = item.item.quantity
    if (qty < 2) return null
    const pairs = Math.floor(qty / 2)
    const remainder = qty % 2
    // Effective rate: full pairs cost 1.5× (1 + 0.5), remainder at full price
    return (pairs * 1.5 + remainder) / qty
  }
}

class CartCalculator {
  constructor(private strategies: DiscountStrategy[]) {}

  calculate(cart: CartItem[], products: Product[]): CalculationResult {
    const cartItems: CartItemWithProduct[] = cart.map(item => {
      const product = products.find(p => p.id === item.productId)
      if (!product) throw new Error(`Product ${item.productId} not found`)
      return { item, product }
    })

    const originalTotal = cartItems.reduce(
      (sum, { item, product }) => sum + product.price * item.quantity,
      0
    )

    const context: DiscountContext = { cartItems, originalTotal }

    const discounts: DiscountDetail[] = cartItems.map(({ item, product }) => {
      const rates = this.strategies
        .map(s => ({ name: s.name, rate: s.getRate({ item, product }, context) }))
        .filter(r => r.rate !== null) as { name: string; rate: number }[]

      let discountType: DiscountDetail['discountType'] = 'none'
      let discountRate = 1

      if (rates.length > 0) {
        const best = rates.reduce((a, b) => (a.rate < b.rate ? a : b))
        discountRate = best.rate
        discountType = best.name as DiscountDetail['discountType']
      }

      const originalSubtotal = product.price * item.quantity
      const finalSubtotal = new Decimal(originalSubtotal)
        .mul(discountRate)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toNumber()
      const finalPrice = new Decimal(product.price)
        .mul(discountRate)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toNumber()

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        originalPrice: product.price,
        originalSubtotal,
        discountType,
        discountRate,
        finalPrice,
        finalSubtotal,
        saved: originalSubtotal - finalSubtotal,
      }
    })

    const finalTotal = discounts.reduce((sum, d) => sum + d.finalSubtotal, 0)
    const totalSaved = originalTotal - finalTotal

    const types = new Set(discounts.map(d => d.discountType))
    let appliedDiscount: CalculationResult['appliedDiscount']
    if (types.size === 1) {
      const only = [...types][0]
      appliedDiscount = only === 'none' ? 'none' : (only as 'full_amount' | 'category' | 'second_item_half')
    } else {
      appliedDiscount = 'mixed'
    }

    return { originalTotal, finalTotal, totalSaved, appliedDiscount, discounts }
  }
}

export const calculator = new CartCalculator([
  new FullAmountStrategy(),
  new CategoryStrategy(),
  new SecondItemHalfPriceStrategy(),
])

export const calculateCart = (
  cart: CartItem[],
  products: Product[]
): CalculationResult => calculator.calculate(cart, products)
