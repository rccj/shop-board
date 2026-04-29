# Pending Features — Ready to Integrate

All items below are already implemented in the working tree / can be re-applied.
Each section lists the files to add/restore plus the key wiring step.

---

## 1. 折扣規則後台管理（Discount Admin UI）

### New files to commit
| File | Description |
|------|-------------|
| `src/types/discountConfig.ts` | `DiscountRuleType`, `FullAmountConfig`, `CategoryConfig`, `SecondItemConfig`, `DiscountRuleConfig` |
| `src/mock/discountConfig.ts` | localStorage CRUD — `getDiscountRules`, `saveDiscountRules`, `initDiscountRules`, `getActiveRules` |
| `src/components/ui/switch.tsx` | Radix UI Switch component (requires `@radix-ui/react-switch` in package.json) |
| `src/pages/admin/Discounts.tsx` | Full CRUD admin UI — table, add/edit modal (with inline validation), delete confirm |

### Modified files to re-apply
| File | What to add |
|------|-------------|
| `src/lib/discount.ts` | Parameterise strategies + add `buildCalculator(rules)` + change `calculateCart` to use `buildCalculator(getActiveRules())` |
| `src/App.tsx` | Re-add import + NAV_ITEMS entry + route (see snippet below) |
| `src/pages/admin/Dashboard.tsx` | Replace `TrendingUp` card with `Tag` "折扣規則" → `/admin/discounts` |

### App.tsx snippet to restore
```tsx
// imports — add:
import AdminDiscounts from '@/pages/admin/Discounts'
import { Package, Tag, Store, LogOut, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'

// NAV_ITEMS — add entry:
{ to: '/admin/discounts', label: '折扣規則', icon: Tag },

// Routes — add inside <Routes>:
<Route
  path="/admin/discounts"
  element={
    <AdminGuard>
      <AdminLayout>
        <AdminDiscounts />
      </AdminLayout>
    </AdminGuard>
  }
/>
```

### discount.ts key changes
```ts
// 1. Strategies become configurable:
class FullAmountStrategy { constructor(private threshold: number, private rate: number) {} }
class CategoryStrategy   { constructor(private category: string, private minQty: number, private rate: number) {} }
class SecondItemStrategy {
  name = 'second_item_half'
  constructor(private rate: number) {}
  calculate(item, _ctx) {
    const { quantity: qty } = item.item
    const price = item.product.price
    if (qty < 2) return null
    const pairs = Math.floor(qty / 2); const rem = qty % 2
    return { rate: this.rate, finalSubtotal: round(dec(price).mul(pairs * (1 + this.rate) + rem)) }
  }
}

// 2. Add at bottom:
export function buildCalculator(rules: DiscountRuleConfig[]): CartCalculator { ... }
export const calculateCart = (cart, products) =>
  buildCalculator(getActiveRules()).calculate(cart, products)
```

---

## 2. 折扣顯示優化 (Smart 折 Display)

Planned redesign of discount label in CartDrawer + Checkout.

### Option A — Current (committed): raw ×10 labels
- `滿額9折`, `第二件半價`, `分類8.5折` (uses `Math.round(rate * 10)` or hardcoded)

### Option B — Smart helper (ready to implement)
```ts
// src/lib/formatDiscount.ts
export function formatDiscount(rate: number): string {
  const pct = Math.round(rate * 100)
  return pct % 10 === 0 ? `${pct / 10}折` : `${pct}折`
  // 0.9 → "9折",  0.85 → "85折",  0.75 → "75折"
}
```
Replace inline `Math.round(rate * 10)折` calls in:
- `src/components/store/CartDrawer.tsx` (2 places)
- `src/pages/store/Checkout.tsx` (2 places)

### Option C — % off input (in progress, NOT stable)
Change discount input from 折 units (0.1–9.9) to % off (1–99 integer).
- 10% off → rate 0.9 → display "9折"
- 15% off → rate 0.85 → display "85折"
- FormState field: `offPct` instead of `rate`
- Conversion: `fromOffPct(n) = (100-n)/100`, `toOffPct(r) = Math.round((1-r)*100)`
- **Status**: UI spec complete, not committed. Implement after stabilisation.

---

## 3. package.json dependency
```
@radix-ui/react-switch   (required by src/components/ui/switch.tsx)
```
Install: `pnpm add @radix-ui/react-switch`

---

## Integration order
1. `pnpm add @radix-ui/react-switch`
2. Add `src/types/discountConfig.ts`
3. Add `src/mock/discountConfig.ts`
4. Add `src/components/ui/switch.tsx`
5. Apply `src/lib/discount.ts` changes
6. Add `src/pages/admin/Discounts.tsx`
7. Patch `src/App.tsx` (snippet above)
8. Patch `src/pages/admin/Dashboard.tsx`
9. `pnpm tsc --noEmit && pnpm test`
