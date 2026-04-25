# TASK2-DISCOUNT — 題目二：購物車折扣計算系統實作筆記

## 一、題目要求

### 第一部分：基本實作
1. 計算購物車的原始總金額
2. 根據折扣規則計算最終金額
3. 顯示折扣明細（哪些商品套用了哪種折扣）

### 第二部分：擴展思考
4. 如果要新增「同品項第二件半價」的規則，你會如何設計？
5. 說明你的程式碼如何方便未來新增其他折扣規則

---

## 二、Interface（完全照 PDF，不得更改）

```typescript
// types/discount.ts

interface Product {
  id: number
  name: string
  price: number
  category: 'electronics' | 'clothing' | 'books'
}

interface CartItem {
  productId: number
  quantity: number
}

interface DiscountDetail {
  productId: number
  productName: string
  quantity: number
  originalPrice: number      // 單價
  originalSubtotal: number   // 小計（單價 × 數量）
  discountType: 'full_amount' | 'category' | 'none'
  discountRate: number       // 折扣率（0.9 表示 9 折）
  finalPrice: number         // 折扣後單價
  finalSubtotal: number      // 折扣後小計
  saved: number              // 省下的金額
}

interface CalculationResult {
  originalTotal: number
  finalTotal: number
  totalSaved: number
  appliedDiscount: 'full_amount' | 'category' | 'mixed' | 'none'
  discounts: DiscountDetail[]
}
```

---

## 三、折扣規則

| 優先順序 | 規則 | 條件 | 折扣率 |
|---------|------|------|--------|
| 1（最高）| 滿額折扣 | 原始總金額 ≥ 10,000 | 0.9（整筆） |
| 2 | 分類折扣 - electronics | 同類別數量 ≥ 2 件 | 0.85 |
| 2 | 分類折扣 - clothing | 同類別數量 ≥ 3 件 | 0.8 |
| 2 | 分類折扣 - books | 同類別數量 ≥ 5 件 | 0.7 |
| 3（最低）| 無折扣 | 以上都不符合 | 1.0 |

**關鍵規則：**
- 滿額折扣觸發條件看**原始總金額**
- 每件商品只套用一種折扣（取折扣率最小，即最優惠的）
- `appliedDiscount` 判斷：
  - 所有商品都是 `full_amount` → `'full_amount'`
  - 所有商品都是 `category`（無任何 full_amount 或 none）→ `'category'`
  - 只要有任何一筆是 `none`（無折扣），或是混合了不同折扣類型 → `'mixed'`
  - 所有商品都是 `none` → `'none'`

---

## 四、判斷流程

```
Step 1. 計算原始總金額（所有商品原價 × 數量加總）
Step 2. 判斷是否觸發滿額折扣（原始總金額 ≥ 10,000）→ fullAmountRate = 0.9 or null
Step 3. 計算各類別總數量
Step 4. 每件商品判斷分類折扣率 → categoryRate or null
Step 5. 每件商品取 min(fullAmountRate, categoryRate)，都是 null 則 rate = 1
Step 6. 計算每件商品 finalSubtotal、saved
Step 7. 加總 finalTotal、totalSaved
Step 8. 判斷 appliedDiscount
```

---

## 五、五個範例驗證

### Example 1

```typescript
const cart1 = [
  { productId: 1, quantity: 1 },  // iPhone  × 1 = 30000
  { productId: 2, quantity: 2 },  // AirPods × 2 = 10000
  { productId: 3, quantity: 3 },  // T-shirt × 3 = 1500
  { productId: 5, quantity: 2 },  // Book    × 2 = 700
]
// originalTotal: 42200（≥10000 → 滿額觸發）
// electronics 共 3 件(1+2) → 0.85
// clothing 共 3 件 → 0.8
// books 共 2 件 < 5 → 無分類折扣
```

| 商品 | 分類折扣 | 滿額折扣 | 採用 |
|------|---------|---------|------|
| iPhone | 0.85 | 0.9 | **0.85** category |
| AirPods | 0.85 | 0.9 | **0.85** category |
| T-shirt | 0.8 | 0.9 | **0.8** category |
| Book | 無 | 0.9 | **0.9** full_amount |

```typescript
{
  originalTotal: 42200,
  finalTotal: 35830,
  totalSaved: 6370,
  appliedDiscount: 'mixed',
  // iPhone  x1: 30000 → 25500 (category 0.85)    省4500
  // AirPods x2: 10000 → 8500  (category 0.85)    省1500
  // T-shirt x3: 1500  → 1200  (category 0.8)     省300
  // Book    x2: 700   → 630   (full_amount 0.9)  省70
}
```

---

### Example 2

```typescript
const cart2 = [
  { productId: 1, quantity: 1 },  // iPhone  × 1 = 30000
  { productId: 2, quantity: 1 },  // AirPods × 1 = 5000
  { productId: 3, quantity: 3 },  // T-shirt × 3 = 1500
]
// originalTotal: 36500（≥10000 → 滿額觸發）
// electronics 共 2 件(1+1) → 0.85
// clothing 共 3 件 → 0.8
```

| 商品 | 分類折扣 | 滿額折扣 | 採用 |
|------|---------|---------|------|
| iPhone | 0.85 | 0.9 | **0.85** category |
| AirPods | 0.85 | 0.9 | **0.85** category |
| T-shirt | 0.8 | 0.9 | **0.8** category |

```typescript
{
  originalTotal: 36500,
  finalTotal: 30950,
  totalSaved: 5550,
  appliedDiscount: 'category',
  // iPhone  x1: 30000 → 25500 (category 0.85) 省4500
  // AirPods x1: 5000  → 4250  (category 0.85) 省750
  // T-shirt x3: 1500  → 1200  (category 0.8)  省300
}
```

---

### Example 3

```typescript
const cart3 = [
  { productId: 1, quantity: 1 },  // iPhone × 1 = 30000
]
// originalTotal: 30000（≥10000 → 滿額觸發）
// electronics 共 1 件 < 2 → 無分類折扣
```

| 商品 | 分類折扣 | 滿額折扣 | 採用 |
|------|---------|---------|------|
| iPhone | 無 | 0.9 | **0.9** full_amount |

```typescript
{
  originalTotal: 30000,
  finalTotal: 27000,
  totalSaved: 3000,
  appliedDiscount: 'full_amount',
  // iPhone x1: 30000 → 27000 (full_amount 0.9) 省3000
}
```

---

### Example 4

```typescript
const cart4 = [
  { productId: 2, quantity: 2 },  // AirPods × 2 = 10000
  { productId: 5, quantity: 2 },  // Book    × 2 = 700
]
// originalTotal: 10700（≥10000 → 滿額觸發）
// electronics 共 2 件 → 0.85
// books 共 2 件 < 5 → 無分類折扣
```

| 商品 | 分類折扣 | 滿額折扣 | 採用 |
|------|---------|---------|------|
| AirPods | 0.85 | 0.9 | **0.85** category |
| Book | 無 | 0.9 | **0.9** full_amount |

```typescript
{
  originalTotal: 10700,
  finalTotal: 9130,
  totalSaved: 1570,
  appliedDiscount: 'mixed',
  // AirPods x2: 10000 → 8500 (category 0.85)   省1500
  // Book    x2: 700   → 630  (full_amount 0.9)  省70
}
```

---

### Example 5

```typescript
const cart5 = [
  { productId: 2, quantity: 3 },  // AirPods × 3 = 15000
  { productId: 3, quantity: 4 },  // T-shirt × 4 = 2000
  { productId: 5, quantity: 5 },  // Book    × 5 = 1750
]
// originalTotal: 18750（≥10000 → 滿額觸發）
// electronics 共 3 件 → 0.85
// clothing 共 4 件 ≥ 3 → 0.8
// books 共 5 件 → 0.7
```

| 商品 | 分類折扣 | 滿額折扣 | 採用 |
|------|---------|---------|------|
| AirPods | 0.85 | 0.9 | **0.85** category |
| T-shirt | 0.8 | 0.9 | **0.8** category |
| Book | 0.7 | 0.9 | **0.7** category |

```typescript
{
  originalTotal: 18750,
  finalTotal: 15575,
  totalSaved: 3175,
  appliedDiscount: 'category',
  // AirPods x3: 15000 → 12750 (category 0.85) 省2250
  // T-shirt x4: 2000  → 1600  (category 0.8)  省400
  // Book    x5: 1750  → 1225  (category 0.7)  省525
}
```

---

## 六、Strategy Pattern 設計

### 核心概念

每種折扣規則為獨立的 Strategy，CartCalculator 注入所有 strategies，每件商品跑過所有規則取最優惠。

```typescript
// lib/discount.ts

interface DiscountContext {
  cartItems: CartItemWithProduct[]
  originalTotal: number
}

interface DiscountStrategy {
  name: string
  // 回傳折扣率，null 表示此規則對該商品不適用
  getRate(item: CartItemWithProduct, context: DiscountContext): number | null
}

// 規則一：滿額折扣
class FullAmountStrategy implements DiscountStrategy {
  name = 'full_amount'
  getRate(_item, context) {
    return context.originalTotal >= 10000 ? 0.9 : null
  }
}

// 規則二：分類折扣
class CategoryStrategy implements DiscountStrategy {
  name = 'category'
  private thresholds = {
    electronics: { min: 2, rate: 0.85 },
    clothing:    { min: 3, rate: 0.8  },
    books:       { min: 5, rate: 0.7  },
  }
  getRate(item, context) {
    const cat = item.product.category
    const threshold = this.thresholds[cat]
    const totalQty = context.cartItems
      .filter(i => i.product.category === cat)
      .reduce((sum, i) => sum + i.quantity, 0)
    return totalQty >= threshold.min ? threshold.rate : null
  }
}

// 主計算器
class CartCalculator {
  constructor(private strategies: DiscountStrategy[]) {}

  calculate(cart: CartItem[], products: Product[]): CalculationResult {
    // 1. 組合 CartItemWithProduct
    // 2. 計算 originalTotal
    // 3. 建立 context
    // 4. 每件商品跑過所有 strategy 取 min rate
    // 5. 組合 DiscountDetail[]
    // 6. 計算 finalTotal、totalSaved、appliedDiscount
  }
}

// 匯出使用
export const calculator = new CartCalculator([
  new FullAmountStrategy(),
  new CategoryStrategy(),
])

export const calculateCart = (
  cart: CartItem[],
  products: Product[]
): CalculationResult => calculator.calculate(cart, products)
```

---

## 七、擴展說明：新增「第二件半價」

只需新增一個 Strategy，不動其他程式碼：

```typescript
class SecondItemHalfPriceStrategy implements DiscountStrategy {
  name = 'second_half_price'
  getRate(item, _context) {
    // 數量 >= 2 時，平均折扣率 = (1 + 0.5) / 2 = 0.75
    // 注意：這個規則可能需要更細緻的 per-unit 計算
    return item.quantity >= 2 ? 0.75 : null
  }
}

// 注入進 CartCalculator
export const calculator = new CartCalculator([
  new FullAmountStrategy(),
  new CategoryStrategy(),
  new SecondItemHalfPriceStrategy(), // 新增這行就好
])
```

---

## 八、實作 Checklist

- [ ] `types/discount.ts` 完全照 PDF interface
- [ ] `lib/discount.ts` Strategy Pattern 實作
  - [ ] `FullAmountStrategy`
  - [ ] `CategoryStrategy`
  - [ ] `CartCalculator`
  - [ ] `calculateCart` 匯出函式
- [ ] 5 個 cart 範例全部驗證通過
- [ ] 購物車頁面串接，展示折扣明細 UI（P1）
