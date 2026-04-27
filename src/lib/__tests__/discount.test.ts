import { describe, it, expect } from 'vitest'
import { calculateCart } from '../discount'
import type { Product } from '@/types/discount'

const p = (id: number, price: number, category: Product['category']): Product => ({
  id,
  name: `Product ${id}`,
  price,
  category,
})

describe('calculateCart', () => {
  it('no discount when below thresholds', () => {
    const result = calculateCart(
      [{ productId: 1, quantity: 1 }],
      [p(1, 500, 'electronics')]
    )
    expect(result.totalSaved).toBe(0)
    expect(result.appliedDiscount).toBe('none')
    expect(result.finalTotal).toBe(500)
  })

  it('full_amount discount at total >= 10000', () => {
    // Use a category that has no category discount (electronics needs 2+ items here only 1)
    // But to avoid triggering category discount, use quantity=1 → electronics needs ≥2
    const result = calculateCart(
      [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 1 }],
      [p(1, 5000, 'electronics'), p(2, 5000, 'electronics')]
    )
    // total=10000 qualifies full_amount(0.9), AND electronics×2 qualifies category(0.85)
    // category wins → see 'picks best' test below
    // For pure full_amount: use clothing×1 that doesn't trigger category
    expect(result.originalTotal).toBe(10000)
  })

  it('full_amount only when category discount does not apply', () => {
    // clothing needs ≥3, only 1 item → no category discount
    const result = calculateCart(
      [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 1 }],
      [p(1, 6000, 'clothing'), p(2, 4000, 'clothing')]
    )
    expect(result.appliedDiscount).toBe('full_amount')
    expect(result.originalTotal).toBe(10000)
    expect(result.finalTotal).toBe(9000)
    expect(result.totalSaved).toBe(1000)
  })

  it('electronics category discount: 2 件 → 85 折', () => {
    const result = calculateCart(
      [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 1 }],
      [p(1, 1000, 'electronics'), p(2, 1000, 'electronics')]
    )
    expect(result.appliedDiscount).toBe('category')
    expect(result.finalTotal).toBe(1700)
    expect(result.totalSaved).toBe(300)
  })

  it('clothing category discount: 3 件 → 8 折', () => {
    const result = calculateCart(
      [{ productId: 1, quantity: 3 }],
      [p(1, 1000, 'clothing')]
    )
    expect(result.appliedDiscount).toBe('category')
    expect(result.finalTotal).toBe(2400)
  })

  it('books category discount: 5 件 → 7 折', () => {
    const result = calculateCart(
      [{ productId: 1, quantity: 5 }],
      [p(1, 200, 'books')]
    )
    expect(result.appliedDiscount).toBe('category')
    expect(result.finalTotal).toBe(700) // 1000 * 0.7
  })

  it('picks best (lowest) discount rate when multiple apply', () => {
    // total = 10000 (full_amount 0.9) AND electronics >= 2 (category 0.85)
    // 0.85 < 0.9 → category wins
    const result = calculateCart(
      [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 1 }],
      [p(1, 5000, 'electronics'), p(2, 5000, 'electronics')]
    )
    expect(result.appliedDiscount).toBe('category')
    expect(result.finalTotal).toBe(8500)
  })

  it('no category discount below threshold (electronics 1 件)', () => {
    const result = calculateCart(
      [{ productId: 1, quantity: 1 }],
      [p(1, 1000, 'electronics')]
    )
    expect(result.appliedDiscount).toBe('none')
  })

  it('mixed discount when items get different discount types', () => {
    // electronics × 2 → category; separate clothing × 1 → no discount
    const result = calculateCart(
      [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
      [p(1, 1000, 'electronics'), p(2, 500, 'clothing')]
    )
    expect(result.appliedDiscount).toBe('mixed')
  })

  it('correct rounding: 1675 * 0.7 should be 1173, not 1172 (float bug)', () => {
    // JS: 1675 * 0.7 = 1172.4999999999998 → Math.round = 1172 (wrong)
    // Decimal.js: 1675 * 0.7 = 1172.5 → ROUND_HALF_UP = 1173 (correct)
    const result = calculateCart(
      [{ productId: 1, quantity: 5 }],
      [p(1, 335, 'books')]
    )
    expect(result.finalTotal).toBe(1173)
  })

  it('throws when product not found in cart', () => {
    expect(() =>
      calculateCart(
        [{ productId: 999, quantity: 1 }],
        [p(1, 500, 'electronics')]
      )
    ).toThrow('Product 999 not found')
  })

  describe('SecondItemHalfPriceStrategy', () => {
    it('qty=1 → no second_item_half discount', () => {
      const result = calculateCart(
        [{ productId: 1, quantity: 1 }],
        [p(1, 1000, 'other')]
      )
      expect(result.appliedDiscount).toBe('none')
      expect(result.finalTotal).toBe(1000)
    })

    it('qty=2 → effective rate 0.75 (second item half price)', () => {
      const result = calculateCart(
        [{ productId: 1, quantity: 2 }],
        [p(1, 1000, 'other')]
      )
      expect(result.appliedDiscount).toBe('second_item_half')
      // 1000 + 500 = 1500
      expect(result.finalTotal).toBe(1500)
      expect(result.totalSaved).toBe(500)
    })

    it('qty=3 → two full + one half = 2500', () => {
      const result = calculateCart(
        [{ productId: 1, quantity: 3 }],
        [p(1, 1000, 'other')]
      )
      expect(result.appliedDiscount).toBe('second_item_half')
      // 1000 + 500 + 1000 = 2500
      expect(result.finalTotal).toBe(2500)
    })

    it('qty=4 → two pairs = 3000', () => {
      const result = calculateCart(
        [{ productId: 1, quantity: 4 }],
        [p(1, 1000, 'other')]
      )
      expect(result.appliedDiscount).toBe('second_item_half')
      // (1000+500) × 2 = 3000
      expect(result.finalTotal).toBe(3000)
    })

    it('books qty=5 → category 0.7 beats second_item_half 0.75', () => {
      const result = calculateCart(
        [{ productId: 1, quantity: 5 }],
        [p(1, 1000, 'books')]
      )
      expect(result.appliedDiscount).toBe('category')
      expect(result.finalTotal).toBe(3500) // 5000 × 0.7
    })

    it('electronics qty=2 → category 0.85 vs second_item_half 0.75 → second_item_half wins', () => {
      // electronics category: 2 items = 0.85 rate
      // second_item_half: qty=2 = 0.75 rate → 0.75 < 0.85 → second_item_half wins
      const result = calculateCart(
        [{ productId: 1, quantity: 2 }],
        [p(1, 1000, 'electronics')]
      )
      expect(result.appliedDiscount).toBe('second_item_half')
      expect(result.finalTotal).toBe(1500)
    })
  })
})
