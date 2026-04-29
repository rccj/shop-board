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

### 核心亮點：高擴展性的折扣引擎 (Strategy Pattern)

電商系統的折扣規則經常變動且複雜，本專案刻意在前端實作了完整的折扣計算引擎，並採用 Strategy Pattern 以確保未來的可擴充性 (OCP 原則)。

```typescript
interface DiscountStrategy {
  name: string
  applies(cart: CartItem[], products: Product[]): boolean
  calculate(item: CartItem, product: Product, cart: CartItem[], products: Product[]): number
}

class FullAmountStrategy implements DiscountStrategy { ... }
class CategoryStrategy implements DiscountStrategy { ... }
```

- **多規則處理機制**：支援滿額折扣、特定分類階梯折扣。當商品同時符合多種折扣時，系統會自動比對並套用「最優惠 (Best-Deal)」的策略，且不產生規則疊加衝突。
- **無痛擴充新規則 (範例：限定商品的第二件半價)**
  真實商業情境中，活動往往會限制「特定分類」或「特定商品」。得益於 Strategy Pattern，我們能將條件做為參數注入，**完全不需修改核心的 `CartCalculator` 引擎**：
  
  ```typescript
  class SecondItemHalfPriceStrategy implements DiscountStrategy {
    name = 'second_item_half'
    
    // 透過 constructor 定義活動適用範圍 (未傳遞則全站適用)
    constructor(private targetCategory?: string, private targetProductIds?: number[]) {}

    calculate(item: CartItemWithProduct, _context: DiscountContext): DiscountResult | null {
      // 1. 檢查是否符合活動範圍
      if (this.targetCategory && item.product.category !== this.targetCategory) return null;
      if (this.targetProductIds && !this.targetProductIds.includes(item.product.id)) return null;

      // 2. 數量達標判定與偶數件半價邏輯
      if (item.item.quantity < 2) return null;
      // ... 
    }
  }
  ```
  
  開發者只需在系統初始化時，將新策略注入 `CartCalculator`（並可自訂限制條件，例如針對服飾類），即完美達成需求擴充，**系統現有程式碼完全不動**：
  
  ```typescript
  export const calculator = new CartCalculator([
    new FullAmountStrategy(),
    new CategoryStrategy(),
    
    // 擴充範例一：限定「特定分類（服飾類）」享有第二件半價
    new SecondItemHalfPriceStrategy('clothing'),
    
    // 擴充範例二：限定「特定商品（ID: 1, 2）」享有第二件半價
    // new SecondItemHalfPriceStrategy(undefined, [1, 2])
  ])
  ```

### Standalone Mock API Layer (純前端全功能展示)

為了讓本專案能作為完全獨立的 Live Demo 運行，無需依賴後端即可體驗完整功能：

```typescript
const delay = (ms = 400) => new Promise(res => setTimeout(res, ms + Math.random() * 200))

interface ApiResponse<T> {
  data: T
  total?: number
  page?: number
  pageSize?: number
}
```

- 實作了基於 `localStorage` 的 API Handler，完整支援 CRUD 操作與資料持久化（重整頁面保留操作結果）。
- 模擬真實 API 延遲 (300ms–600ms) 與分頁/篩選邏輯：**所有的分頁、搜尋、篩選運算皆在 Mock Server 端處理**，而非前端取得全資料後再 filter，完整模擬真實後端 API 請求情境。
- 嚴格遵守架構分層，元件僅透過 `src/api` 發送請求，未來若需串接真實後端，前端 UI 元件只需替換 API 層，完全不需重構。

### 購物車 Drawer × Radix Popover 互動問題

Vaul Drawer 使用 Radix `DismissableLayer`；Popover 若透過 Portal 渲染至 `document.body`，  
點擊確認/取消按鈕時，會被 Drawer 判定為「外部點擊」而強制關閉，導致按鈕的點擊事件失效。

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

若省略 `_hasHydrated` 守衛，在首次 render 時（此時 hydration 尚未完成）`token` 會是 `null`，系統將直接跳轉至登入頁，  
導致即使 `localStorage` 中有有效的 token，使用者也無法順利進入後台。

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
- `discount.test.ts` — 覆蓋完整的購物車業務邏輯（包含滿額 9 折、多層級的分類階梯折扣、防疊加 Best-Deal 計算），精準驗證折扣後的每件明細與總額。
- `useCart.test.ts` — 加入、更新、移除、清空購物車狀態管理。
- `cartStore.test.ts` — Zustand store 操作。
- `handlers.test.ts` — Mock API CRUD、分頁、篩選與批次操作邏輯。

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
