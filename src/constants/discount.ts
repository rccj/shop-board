export const FULL_AMOUNT_THRESHOLD = 10000
export const FULL_AMOUNT_RATE = 0.9

export const CATEGORY_DISCOUNT = {
  electronics: { minQty: 2, rate: 0.85 },
  clothing:    { minQty: 3, rate: 0.8  },
  books:       { minQty: 5, rate: 0.7  },
} as const
