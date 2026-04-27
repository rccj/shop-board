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

/**
 * Each strategy owns both the display rate and the actual subtotal calculation.
 * This allows complex pricing rules (e.g. second item half price, buy-N-get-one-free)
 * to compute exact subtotals without approximating via an effective rate.
 *
 * rate       — for display only (e.g. 0.9 → "9折", 0.5 → "第二件半價")
 * finalSubtotal — actual amount charged; CartCalculator picks lowest as best deal
 */
interface DiscountResult {
  rate: number
  finalSubtotal: number
}

interface DiscountStrategy {
  name: string
  calculate(item: CartItemWithProduct, context: DiscountContext): DiscountResult | null
}

const dec = (n: number) => new Decimal(n)
const round = (d: Decimal) => d.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()

class FullAmountStrategy implements DiscountStrategy {
  name = 'full_amount'
  calculate(item: CartItemWithProduct, context: DiscountContext): DiscountResult | null {
    if (context.originalTotal < 10000) return null
    const originalSubtotal = item.product.price * item.item.quantity
    return {
      rate: 0.9,
      finalSubtotal: round(dec(originalSubtotal).mul(0.9)),
    }
  }
}

class CategoryStrategy implements DiscountStrategy {
  name = 'category'
  private thresholds: Record<string, { min: number; rate: number }> = {
    electronics: { min: 2, rate: 0.85 },
    clothing: { min: 3, rate: 0.8 },
    books: { min: 5, rate: 0.7 },
  }

  calculate(item: CartItemWithProduct, context: DiscountContext): DiscountResult | null {
    const cat = item.product.category
    const threshold = this.thresholds[cat]
    if (!threshold) return null
    const totalQty = context.cartItems
      .filter(i => i.product.category === cat)
      .reduce((sum, i) => sum + i.item.quantity, 0)
    if (totalQty < threshold.min) return null
    const originalSubtotal = item.product.price * item.item.quantity
    return {
      rate: threshold.rate,
      finalSubtotal: round(dec(originalSubtotal).mul(threshold.rate)),
    }
  }
}

class SecondItemHalfPriceStrategy implements DiscountStrategy {
  name = 'second_item_half'
  calculate(item: CartItemWithProduct, _context: DiscountContext): DiscountResult | null {
    const qty = item.item.quantity
    if (qty < 2) return null
    const price = item.product.price
    const pairs = Math.floor(qty / 2)
    const remainder = qty % 2
    // Each pair: full price + half price = 1.5× unit price
    const finalSubtotal = round(dec(price).mul(pairs * 1.5 + remainder))
    return { rate: 0.5, finalSubtotal }
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
      const candidates = this.strategies
        .map(s => ({ name: s.name, result: s.calculate({ item, product }, context) }))
        .filter((c): c is { name: string; result: DiscountResult } => c.result !== null)

      let discountType: DiscountDetail['discountType'] = 'none'
      let discountRate = 1
      const originalSubtotal = product.price * item.quantity
      let finalSubtotal = originalSubtotal

      if (candidates.length > 0) {
        // Best deal = lowest finalSubtotal (what the customer actually pays)
        const best = candidates.reduce((a, b) =>
          a.result.finalSubtotal < b.result.finalSubtotal ? a : b
        )
        discountType = best.name as DiscountDetail['discountType']
        discountRate = best.result.rate
        finalSubtotal = best.result.finalSubtotal
      }

      const finalPrice = round(dec(finalSubtotal).div(item.quantity))

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
