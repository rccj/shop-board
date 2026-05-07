import Decimal from 'decimal.js'
import {
  Product,
  CartItem,
  DiscountDetail,
  CalculationResult,
} from '@/types/discount'
import { FULL_AMOUNT_THRESHOLD, FULL_AMOUNT_RATE, CATEGORY_DISCOUNT } from '@/constants/discount'

interface CartItemWithProduct {
  item: CartItem
  product: Product
}

interface DiscountContext {
  cartItems: CartItemWithProduct[]
  originalTotal: number
  categoryTotals: Map<string, number>
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
    if (context.originalTotal < FULL_AMOUNT_THRESHOLD) return null
    const originalSubtotal = item.product.price * item.item.quantity
    return {
      rate: FULL_AMOUNT_RATE,
      finalSubtotal: round(dec(originalSubtotal).mul(FULL_AMOUNT_RATE)),
    }
  }
}

class CategoryStrategy implements DiscountStrategy {
  name = 'category'

  calculate(item: CartItemWithProduct, context: DiscountContext): DiscountResult | null {
    const cat = item.product.category
    const rule = CATEGORY_DISCOUNT[cat as keyof typeof CATEGORY_DISCOUNT]
    if (!rule) return null
    const totalQty = context.categoryTotals.get(cat) ?? 0
    if (totalQty < rule.minQty) return null
    const originalSubtotal = item.product.price * item.item.quantity
    return {
      rate: rule.rate,
      finalSubtotal: round(dec(originalSubtotal).mul(rule.rate)),
    }
  }
}

/* SecondItemHalfPriceStrategy — disabled, re-enable when needed
class SecondItemHalfPriceStrategy implements DiscountStrategy {
  name = 'second_item_half'
  constructor(private targetCategories?: string[]) {}
  calculate(item: CartItemWithProduct, _context: DiscountContext): DiscountResult | null {
    if (this.targetCategories && !this.targetCategories.includes(item.product.category)) return null
    const qty = item.item.quantity
    if (qty < 2) return null
    const price = item.product.price
    const pairs = Math.floor(qty / 2)
    const remainder = qty % 2
    const finalSubtotal = round(dec(price).mul(pairs * 1.5 + remainder))
    return { rate: 0.5, finalSubtotal }
  }
}
*/

// class TieredFullAmountStrategy implements DiscountStrategy {
//   name = 'tiered_full_amount'

//   constructor(private tiers: { threshold: number; rate: number }[]) {}

//   calculate(item, context) {
//     // 找到所有符合門檻的 tier，rate 連乘
//     const applicableTiers = this.tiers.filter(t => context.originalTotal >= t.threshold)
//     if (applicableTiers.length === 0) return null

//     const combinedRate = applicableTiers.reduce((rate, t) => rate * t.rate, 1)
//     const originalSubtotal = item.product.price * item.item.quantity
//     return {
//       rate: combinedRate,
//       finalSubtotal: round(dec(originalSubtotal).mul(combinedRate)),
//     }
//   }
// }

class CartCalculator {
  constructor(private strategies: DiscountStrategy[]) { }

  calculate(cart: CartItem[], products: Product[]): CalculationResult {
    const productMap = new Map(products.map(p => [p.id, p]))

    const cartItems: CartItemWithProduct[] = cart.map(item => {
      const product = productMap.get(item.productId)
      if (!product) throw new Error(`Product ${item.productId} not found`)
      return { item, product }
    })

    const originalTotal = cartItems.reduce(
      (sum, { item, product }) => sum + product.price * item.quantity,
      0
    )

    const categoryTotals = new Map<string, number>()
    for (const { item, product } of cartItems) {
      categoryTotals.set(product.category, (categoryTotals.get(product.category) ?? 0) + item.quantity)
    }

    const context: DiscountContext = { cartItems, originalTotal, categoryTotals }

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
    if (types.size === 0) {
      appliedDiscount = 'none'
    } else if (types.size === 1) {
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
  // new SecondItemHalfPriceStrategy(['clothing', 'books']),

  //   new TieredFullAmountStrategy([
  //   { threshold: 10000, rate: 0.9 },
  //   { threshold: 20000, rate: 0.95 },
  // ])
])

export const calculateCart = (
  cart: CartItem[],
  products: Product[]
): CalculationResult => calculator.calculate(cart, products)
