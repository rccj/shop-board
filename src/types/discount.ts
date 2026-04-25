export interface Product {
  id: number
  name: string
  price: number
  category: 'electronics' | 'clothing' | 'books'
}

export interface CartItem {
  productId: number
  quantity: number
}

export interface DiscountDetail {
  productId: number
  productName: string
  quantity: number
  originalPrice: number
  originalSubtotal: number
  discountType: 'full_amount' | 'category' | 'none'
  discountRate: number
  finalPrice: number
  finalSubtotal: number
  saved: number
}

export interface CalculationResult {
  originalTotal: number
  finalTotal: number
  totalSaved: number
  appliedDiscount: 'full_amount' | 'category' | 'mixed' | 'none'
  discounts: DiscountDetail[]
}
