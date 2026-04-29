# Shop Board

電商後台管理系統，整合前台購物流程與折扣計算引擎。

**[Live Demo](https://rccj.github.io/shop-board)**  
Admin: `admin` / `admin123`

---

## 功能概覽

### 商品管理後台 (`/admin/products`)

| 功能 | 實作細節 |
|------|---------|
| 商品列表 | 表格顯示圖片、名稱、分類、價格、庫存、狀態 |
| 分頁 | 每頁 10 / 20 / 50 筆可選 |
| 即時搜尋 | 300ms debounce + 中文 IME 輸入法防穿透（compositionstart/end） |
| 多條件篩選 | 分類、價格區間、庫存狀態、上架狀態 AND 條件疊加 |
| 排序 | 價格、庫存、銷量（asc / desc toggle） |
| 批次操作 | 上架 / 下架 / 刪除，含 Gmail 式 selection（換頁自動清除） |
| 新增商品 | Modal 表單 + 圖片 URL / 本地上傳（base64） |
| 編輯商品 | 載入現有資料，修改後儲存，inline status toggle |
| 刪除商品 | AlertDialog 確認 → 刪除後更新列表 |
| CSV 批次匯入 | 逐列驗證、錯誤預覽、最多 200 筆 |

### 前台商店 + 購物車折扣引擎

| 功能 | 實作細節 |
|------|---------|
| 商品列表 | 搜尋、分類篩選、排序、熱銷區塊 |
| 商品詳情 | compareAtPrice 劃線原價、低庫存警告、加入購物車 |
| 購物車 | Drawer 右滑，數量調整、確認移除 Popover、即時折扣計算 |
| 折扣引擎 | 滿額9折、分類折扣、per-item best-deal，不疊加 |
| 結帳頁 | 訂單摘要、收件資訊表單（react-hook-form + zod 驗證） |

---

## 技術棧

| | |
|---|---|
| Framework | React 18 + TypeScript（strict） |
| Build | Vite |
| Routing | React Router v6（Hash Router） |
| State | Zustand — cart（persist）、product selection、auth |
| UI | shadcn/ui + Tailwind CSS v3 |
| Forms | React Hook Form + Zod |
| Mock API | localStorage（async/await + 300–600ms 模擬延遲） |
| Testing | Vitest（unit）+ Playwright（E2E） |

---

## 架構設計

### API 層隔離

```
src/api/products.ts   ← 所有元件、hook 的唯一入口
src/api/cart.ts       ← 購物車計算 API
src/mock/handlers.ts  ← localStorage CRUD 實作
```

元件與 hook 只依賴 `src/api/`，mock 實作細節完全封裝在 `src/mock/`。  
未來擴充後端只需替換 `src/api/` 這一層，元件與業務邏輯不動。  
見 [MOCK-API.md](./MOCK-API.md) 完整端點設計。

### 折扣引擎：Strategy Pattern

```typescript
interface DiscountStrategy {
  name: string
  applies(cart: CartItem[], products: Product[]): boolean
  calculate(item: CartItem, product: Product, cart: CartItem[], products: Product[]): number
}

class FullAmountStrategy implements DiscountStrategy { ... }
class CategoryStrategy implements DiscountStrategy { ... }
class SecondItemHalfPriceStrategy implements DiscountStrategy { ... }  // 擴充示範
```

`CartCalculator` 持有策略陣列，每件商品取所有適用策略中折扣最低者（best-deal selection）。  
新增折扣規則：實作 interface → push 進陣列，**現有程式碼不動**。

### Mock API 設計

```typescript
const delay = (ms = 400) => new Promise(res => setTimeout(res, ms + Math.random() * 200))

interface ApiResponse<T> {
  data: T
  total?: number
  page?: number
  pageSize?: number
}
```

資料存於 `localStorage`，重整頁面保留操作結果，模擬真實 API 使用情境。

### 購物車 Drawer × Radix Popover 互動問題

Vaul Drawer 使用 Radix `DismissableLayer`；Popover 若透過 Portal 渲染至 `document.body`，  
點擊確認/取消按鈕時 Drawer 判定為「外部點擊」而關閉，按鈕 click 無效。

解法：`confirm-popover.tsx` 改用 `PopoverPrimitive.Content`（無 Portal），  
渲染保留在 Drawer DOM 樹內，`position: fixed` 定位仍正常（Drawer portal 已在 body 層無 transform 祖先）。

### Auth Guard — Zustand persist 非同步水合

```typescript
function AdminGuard({ children }) {
  const token = useAuthStore(s => s.token)
  const hydrated = useAuthStore(s => s._hasHydrated)  // ← 關鍵
  if (!hydrated) return null   // 等待 localStorage 讀取完成再決定是否跳轉
  if (!token) return <Navigate to="/admin/login" ... />
  return <>{children}</>
}
```

若省略 `_hasHydrated` 守衛，第一次 render `token = null`（hydration 尚未完成）→ 直接跳轉登入頁，  
即使 localStorage 有效 token 也無法進入後台。

---

## 快速開始

```bash
pnpm install
pnpm dev
```

| 網址 | 說明 |
|------|------|
| `http://localhost:5173/shop-board/#/` | 前台商店 |
| `http://localhost:5173/shop-board/#/cart` | 購物車折扣展示頁 |
| `http://localhost:5173/shop-board/#/admin/login` | 後台登入（admin / admin123） |

---

## 測試

```bash
# Unit tests（折扣引擎、購物車 store、mock handlers）
pnpm test

# E2E tests（Playwright — smoke / cart / admin CRUD）
pnpm e2e
```

Unit test 涵蓋：
- `discount.test.ts` — 5 個場景完整驗算（原始金額、折扣後金額、每件折扣明細）
- `useCart.test.ts` — 加入、更新、移除、清空購物車
- `cartStore.test.ts` — Zustand store 操作
- `handlers.test.ts` — mock API CRUD + 分頁 + 批次操作

---

## 專案結構

```
src/
├── api/              # API 層（業務邏輯的唯一入口）
├── mock/             # Mock data + localStorage handlers
├── components/
│   ├── ui/           # shadcn/ui 元件
│   ├── admin/        # 後台專用：Table, Filters, AddModal, EditModal, BatchToolbar
│   └── store/        # 前台：ProductCard, CartDrawer, Footer
├── pages/
│   ├── store/        # ProductList, ProductDetail, Cart, Checkout
│   └── admin/        # Login, Products
├── hooks/            # useProducts, useCart
├── store/            # cartStore（persist）, productStore（selection）, authStore
├── lib/              # discount.ts, categoryColors, discountHints
└── types/            # Product, CartItem, DiscountDetail, CalculationResult
```
