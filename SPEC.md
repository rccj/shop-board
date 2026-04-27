# Shop Board — 專案規格書

## 一、題目解析

### 題目一：商品管理系統（後台）

管理員視角的後台介面，負責商品的完整生命週期管理。

**核心功能需求：**

| 功能 | 說明 |
|------|------|
| 商品列表 | 表格顯示圖片、名稱、分類、價格、庫存、狀態 |
| 分頁 | 每頁 10 / 20 / 50 筆可選 |
| 即時搜尋 | 輸入商品名稱即時過濾，debounce 處理 |
| 篩選 | 分類、價格區間、庫存狀態 |
| 排序 | 價格、庫存、銷量（升冪/降冪） |
| 批次操作 | 勾選多筆 → 批次上架 / 下架 / 刪除 |
| 編輯商品 | 載入現有資料 → 修改 → 儲存 |
| 刪除商品 | 確認對話框 → 刪除 → 更新列表 |

---

### 題目二：購物車折扣計算系統（Business Logic）

純邏輯層，放在 `src/lib/discount.ts`，無需獨立 UI，但會被前台購物車頁面實際使用。

**折扣規則（優先順序）：**

1. **滿額折扣**：訂單原始總金額 ≥ $10,000 → 整筆打 9 折
2. **分類折扣**：
   - `electronics`：同類別買 2 件以上 → 打 85 折
   - `clothing`：同類別買 3 件以上 → 打 8 折
   - `books`：同類別買 5 件以上 → 打 7 折
3. **折扣不疊加**：每件商品只套用一種折扣（選最優惠）

**設計要求：**
- 回傳完整 `CalculationResult`，包含每件商品的折扣明細
- 可擴展設計，方便未來新增「同品項第二件半價」等規則

---

## 二、技術選型

| 項目 | 選擇 | 理由 |
|------|------|------|
| 框架 | React 18 + TypeScript | 題目本身即有 TS interface，型別安全 |
| 建置工具 | Vite | 快速、現代標準，無需 SSR 不用 Next.js |
| 路由 | React Router v6 | 前後台切換，簡潔清晰 |
| 狀態管理 | Zustand | 輕量，適合此規模，避免 Redux 過度設計 |
| UI 元件 | shadcn/ui | 漂亮、高可客製化、業界主流 |
| 樣式 | Tailwind CSS | 搭配 shadcn/ui，快速開發 |
| Mock API | 自製 `mockApi.ts` | 模擬真實 API 情境（async/await + delay） |
| 部署 | Vercel | 一鍵部署，提供 demo 連結 |
| 後續擴充 | Firebase Firestore | Mock 完成後可無痛替換 API 層 |

---

## 三、專案架構

```
src/
├── api/                  # API 層（統一入口，mock or firebase）
│   ├── products.ts       # 商品 CRUD
│   └── cart.ts           # 購物車
├── mock/                 # Mock 假資料與延遲模擬
│   ├── data.ts           # 初始商品假資料（30 筆，6 分類）
│   └── handlers.ts       # 模擬 API response 格式與延遲
├── components/
│   ├── ui/               # shadcn/ui 元件
│   ├── admin/            # 後台專用元件
│   └── store/
│       └── ProductCard.tsx   # 商品卡片（含折扣 badge、加入購物車）
├── pages/
│   ├── store/
│   │   ├── ProductList.tsx    # 前台商品列表（Hero/熱銷/分類/排序）
│   │   ├── ProductDetail.tsx  # 商品詳情頁（P2 新增）
│   │   └── Cart.tsx           # 購物車（折扣計算 + 滿額進度條）
│   └── admin/
│       ├── Dashboard.tsx      # 後台首頁
│       └── Products.tsx       # 商品管理（題目一）
├── lib/
│   ├── discount.ts       # 折扣計算邏輯（題目二，Strategy Pattern）
│   └── discountHints.ts  # 折扣提示文字（P2 新增）
├── hooks/                # 自定義 hooks
│   ├── useProducts.ts
│   └── useCart.ts
├── store/                # Zustand 狀態
│   ├── cartStore.ts
│   └── productStore.ts
└── types/                # TypeScript interface
    ├── product.ts        # 題目一：照題目給定格式（Category + Product + ProductQueryParams）
    └── discount.ts       # 題目二：完全照 PDF 定義的 interface
```

---

## 三之一、確認決策

| 項目 | 決策 | 備註 |
|------|------|------|
| Mock 資料儲存 | `localStorage` | 重整不消失，體驗接近真實，後續可換 Firebase |
| 商品圖片 | `picsum.photos` placeholder | 先用隨機圖，後續可替換為固定商品圖 |
| 路由 | `/` 前台、`/admin` 後台 | 後台暫無登入保護，後續有時間再加 `/login` + 路由守衛 |

---

## 四、Mock API 設計規範

所有 API call 須符合以下規範，模擬真實後端情境：

```typescript
// 統一 response 格式
interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  pageSize?: number;
  message?: string;
}

// 模擬延遲
const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

// 範例
export const getProducts = async (params: ProductQueryParams): Promise<ApiResponse<Product[]>> => {
  await delay();
  // 過濾、排序、分頁邏輯
  return { data: filtered, total: filtered.length, page: params.page };
};
```

前端需處理：
- Loading 狀態
- Error 狀態
- 搜尋 debounce（300ms），避免 race condition

---

## 五、實作優先級

### P0 — 核心必做（題目直接要求）

- [x] TypeScript interface 定義（`types/product.ts` + `types/discount.ts`）
- [x] Mock 假資料（30 筆商品，含 6 分類，localStorage 持久化）
- [x] Mock API 層（getProducts / getProduct / updateProduct / deleteProduct / batchUpdate / calculateCart）
- [x] 後台商品列表（表格、分頁 10/20/50、搜尋、篩選、排序）
- [x] 批次上架 / 下架 / 刪除
- [x] 編輯商品 Modal（react-hook-form + zod 表單驗證）
- [x] 刪除確認對話框（AlertDialog）
- [x] 折扣計算邏輯（`discount.ts`，Strategy Pattern）
- [x] 所有 5 個 example cart 測試通過

### P1 — 強烈建議（加分、展示完整度）

- [x] 前台商品列表頁（顧客視角，含搜尋/分類/排序）
- [x] 購物車頁面（實際展示折扣計算結果 + 明細）
- [x] 新增商品功能（後台）
- [x] Loading skeleton 動畫（商品列表 + 詳情頁）
- [x] 空狀態處理（無搜尋結果 + 空購物車）
- [x] RWD 響應式設計（sm/md/lg 斷點）

### P2 — 加分項（已完成）

**前台**
- [x] 前台商品詳情頁（`/products/:id`）— 圖片、描述、折扣提示、低庫存警示、相關商品
- [x] 折扣活動提示 — ProductCard 顯示分類折扣 hint + 折扣 % badge
- [x] Hero Banner — 首頁限時活動區塊，展示所有折扣規則
- [x] 熱銷商品區塊 — 首頁前 6 名（按銷量排序）
- [x] 商品分類入口 Grid — emoji 圖示快速篩選
- [x] 排序下拉選單（預設/價格低→高/價格高→低/最熱銷）
- [x] 滿額進度條 — 購物車頁顯示距離 NT$10,000 的進度
- [x] Toast 通知（sonner） — 加入購物車即時反饋
- [x] 分類 badge 顏色 — 各分類獨立顏色，border-only 設計風格

**後台 UX 強化**
- [x] 新增商品 Modal — 含圖片欄位（URL 輸入 / 本地上傳 FileReader base64 持久化）
- [x] 表單驗證 — React Hook Form + Zod，錯誤紅框 + 紅字提示，不允許空白送出
- [x] Toast 通知 — 後台所有操作（新增/編輯/刪除/批次）成功與失敗皆有反饋
- [x] 批次刪除確認 Dialog — 防止誤操作，顯示將刪除筆數
- [x] 上架狀態篩選器 — Filter 新增 active / inactive 篩選
- [x] Inline 上架/下架 toggle — 點 Table 中的狀態 badge 直接切換，免開 Modal
- [x] Floating batch action toolbar — 勾選後從底部滑入的懸浮 pill，不佔版面
- [x] 篩選啟用狀態 badge — 「重置篩選」按鈕旁顯示目前啟用的篩選數
- [x] 搜尋 + 篩選整合 — 搜尋欄與篩選器合為同一區塊，視覺統一
- [x] Empty state CTA — 無結果時顯示「清除篩選」按鈕
- [x] 分頁資訊改善 — 「共 N 筆，每頁 X 筆」+ 導覽按鈕，設定與導覽語意分離
- [x] Modal 捲動優化 — header/footer 固定，表單內容區獨立捲動
- [x] 後台導覽簡化 — `/admin` 直接跳轉 `/admin/products`，header 只保留「前台商店」

**批量匯入**
- [x] CSV 批量匯入 — 上傳 CSV → 即時逐列驗證 → 預覽錯誤 → 一次 API 呼叫匯入
- [x] 匯入錯誤處理 — 格式錯誤列標紅 + 說明，僅送出合法列，跳過數量分開顯示
- [x] 匯入上限保護 — 超過 200 筆擋住並提示，防止大量資料誤送
- [x] 匯入中離開保護 — `beforeunload` 攔截頁面離開，關閉按鈕 disabled
- [x] Batch Create API — `handleBatchCreate` 一次寫入，不使用 N 次迴圈

**待完成**
- [ ] `/admin` 登入頁 + 路由守衛
- [ ] 切換 Firebase 真實資料庫
- [ ] 單元測試（`discount.ts` 邏輯測試）

---

## 六、折扣邏輯設計思路

### 6.1 折扣判斷規則（精確定義）

**判斷流程：**

```
Step 1. 計算原始總金額（所有商品原價 × 數量加總）
Step 2. 判斷是否觸發滿額折扣（原始總金額 ≥ 10,000）
Step 3. 計算每件商品的分類折扣率（看該類別數量是否達門檻）
Step 4. 每件商品比較「滿額折扣率 vs 分類折扣率」，取最優惠（數字最小）的那個
Step 5. 若兩者都不適用 → discountType: 'none'，discountRate: 1
Step 6. 加總所有商品折扣後小計 → finalTotal
```

**關鍵規則：**
- 滿額折扣的觸發條件看**原始總金額**
- 滿額折扣套用時，是**每件商品**都有資格打 9 折
- 每件商品最終只套用一種折扣（選折扣率數字最小的，即最優惠）
- `appliedDiscount` 欄位：
  - `'full_amount'` → 所有商品都套用滿額折扣
  - `'category'` → 所有商品都套用分類折扣
  - `'mixed'` → 部分商品套用滿額、部分套用分類（或 none）
  - `'none'` → 無任何折扣

---

### 6.2 商品資料（5 個範例共用）

```typescript
const products: Product[] = [
  { id: 1, name: 'iPhone',  price: 30000, category: 'electronics' },
  { id: 2, name: 'AirPods', price: 5000,  category: 'electronics' },
  { id: 3, name: 'T-shirt', price: 500,   category: 'clothing' },
  { id: 4, name: 'Jeans',   price: 1500,  category: 'clothing' },
  { id: 5, name: 'Book',    price: 350,   category: 'books' },
]
```

---

### 6.3 五個範例逐步計算

---

#### Example 1

```typescript
const cart1 = [
  { productId: 1, quantity: 1 },  // iPhone  × 1 = 30000
  { productId: 2, quantity: 2 },  // AirPods × 2 = 10000
  { productId: 3, quantity: 3 },  // T-shirt × 3 = 1500
  { productId: 5, quantity: 2 },  // Book    × 2 = 700
]
```

**原始總金額：** 30000 + 10000 + 1500 + 700 = **42200**

**折扣分析：**

| 商品 | 分類折扣 | 滿額折扣（≥10000 ✅ 0.9） | 採用 |
|------|----------|--------------------------|------|
| iPhone | electronics 共 3 件 → 0.85 | 0.9 | **0.85** (分類) |
| AirPods | electronics 共 3 件 → 0.85 | 0.9 | **0.85** (分類) |
| T-shirt | clothing 共 3 件 → 0.8 | 0.9 | **0.8** (分類) |
| Book | books 共 2 件 < 5 → 無 | 0.9 | **0.9** (滿額) |

> electronics 總數量 = iPhone(1) + AirPods(2) = 3 件 → 達門檻 ✅

**計算明細：**
- iPhone：30000 × 0.85 = 25500，省 4500
- AirPods：5000 × 2 × 0.85 = 8500，省 1500
- T-shirt：500 × 3 × 0.8 = 1200，省 300
- Book：350 × 2 × 0.9 = 630，省 70

**結果：**
```typescript
{
  originalTotal: 42200,
  finalTotal: 35830,
  totalSaved: 6370,
  appliedDiscount: 'mixed',
  // discounts:
  // iPhone  x1: 30000 → 25500 (category 0.85) 省4500
  // AirPods x2: 10000 → 8500  (category 0.85) 省1500
  // T-shirt x3: 1500  → 1200  (category 0.8)  省300
  // Book    x2: 700   → 630   (full_amount 0.9) 省70
}
```

---

#### Example 2

```typescript
const cart2 = [
  { productId: 1, quantity: 1 },  // iPhone  × 1 = 30000
  { productId: 2, quantity: 1 },  // AirPods × 1 = 5000
  { productId: 3, quantity: 3 },  // T-shirt × 3 = 1500
]
```

**原始總金額：** 30000 + 5000 + 1500 = **36500**

**折扣分析：**

| 商品 | 分類折扣 | 滿額折扣（≥10000 ✅ 0.9） | 採用 |
|------|----------|--------------------------|------|
| iPhone | electronics 共 2 件 → 0.85 | 0.9 | **0.85** (分類) |
| AirPods | electronics 共 2 件 → 0.85 | 0.9 | **0.85** (分類) |
| T-shirt | clothing 共 3 件 → 0.8 | 0.9 | **0.8** (分類) |

**計算明細：**
- iPhone：30000 × 0.85 = 25500，省 4500
- AirPods：5000 × 0.85 = 4250，省 750
- T-shirt：500 × 3 × 0.8 = 1200，省 300

**結果：**
```typescript
{
  originalTotal: 36500,
  finalTotal: 30950,
  totalSaved: 5550,
  appliedDiscount: 'category',
  // discounts:
  // iPhone  x1: 30000 → 25500 (category 0.85) 省4500
  // AirPods x1: 5000  → 4250  (category 0.85) 省750
  // T-shirt x3: 1500  → 1200  (category 0.8)  省300
}
```

---

#### Example 3

```typescript
const cart3 = [
  { productId: 1, quantity: 1 },  // iPhone × 1 = 30000
]
```

**原始總金額：** **30000**

**折扣分析：**

| 商品 | 分類折扣 | 滿額折扣（≥10000 ✅ 0.9） | 採用 |
|------|----------|--------------------------|------|
| iPhone | electronics 共 1 件 < 2 → 無 | 0.9 | **0.9** (滿額) |

**計算明細：**
- iPhone：30000 × 0.9 = 27000，省 3000

**結果：**
```typescript
{
  originalTotal: 30000,
  finalTotal: 27000,
  totalSaved: 3000,
  appliedDiscount: 'full_amount',
  // discounts:
  // iPhone x1: 30000 → 27000 (full_amount 0.9) 省3000
}
```

---

#### Example 4

```typescript
const cart4 = [
  { productId: 2, quantity: 2 },  // AirPods × 2 = 10000
  { productId: 5, quantity: 2 },  // Book    × 2 = 700
]
```

**原始總金額：** 10000 + 700 = **10700**

**折扣分析：**

| 商品 | 分類折扣 | 滿額折扣（≥10000 ✅ 0.9） | 採用 |
|------|----------|--------------------------|------|
| AirPods | electronics 共 2 件 → 0.85 | 0.9 | **0.85** (分類) |
| Book | books 共 2 件 < 5 → 無 | 0.9 | **0.9** (滿額) |

**計算明細：**
- AirPods：5000 × 2 × 0.85 = 8500，省 1500
- Book：350 × 2 × 0.9 = 630，省 70

**結果：**
```typescript
{
  originalTotal: 10700,
  finalTotal: 9130,
  totalSaved: 1570,
  appliedDiscount: 'mixed',
  // discounts:
  // AirPods x2: 10000 → 8500 (category 0.85) 省1500
  // Book    x2: 700   → 630  (full_amount 0.9) 省70
}
```

---

#### Example 5

```typescript
const cart5 = [
  { productId: 2, quantity: 3 },  // AirPods × 3 = 15000
  { productId: 3, quantity: 4 },  // T-shirt × 4 = 2000
  { productId: 5, quantity: 5 },  // Book    × 5 = 1750
]
```

**原始總金額：** 15000 + 2000 + 1750 = **18750**

**折扣分析：**

| 商品 | 分類折扣 | 滿額折扣（≥10000 ✅ 0.9） | 採用 |
|------|----------|--------------------------|------|
| AirPods | electronics 共 3 件 → 0.85 | 0.9 | **0.85** (分類) |
| T-shirt | clothing 共 4 件 > 3 → 0.8 | 0.9 | **0.8** (分類) |
| Book | books 共 5 件 → 0.7 | 0.9 | **0.7** (分類) |

**計算明細：**
- AirPods：5000 × 3 × 0.85 = 12750，省 2250
- T-shirt：500 × 4 × 0.8 = 1600，省 400
- Book：350 × 5 × 0.7 = 1225，省 525

**結果：**
```typescript
{
  originalTotal: 18750,
  finalTotal: 15575,
  totalSaved: 3175,
  appliedDiscount: 'category',
  // discounts:
  // AirPods x3: 15000 → 12750 (category 0.85) 省2250
  // T-shirt x4: 2000  → 1600  (category 0.8)  省400
  // Book    x5: 1750  → 1225  (category 0.7)  省525
}
```

---

### 6.4 Strategy Pattern 設計

採用 **Strategy Pattern（策略模式）**，每種折扣規則為獨立策略，方便擴充：

```typescript
interface DiscountStrategy {
  name: string;
  getDiscountRate(productId: number, context: DiscountContext): number | null
  // 回傳折扣率，null 表示此規則不適用
}

interface DiscountContext {
  cartItems: CartItemWithProduct[]
  originalTotal: number
}

// 各規則獨立實作
class FullAmountDiscount implements DiscountStrategy {
  getDiscountRate(productId, context) {
    return context.originalTotal >= 10000 ? 0.9 : null
  }
}

class CategoryDiscount implements DiscountStrategy {
  getDiscountRate(productId, context) {
    // 計算該商品類別的總數量，判斷是否達門檻
  }
}

// 主計算器
class CartCalculator {
  constructor(private strategies: DiscountStrategy[]) {}
  calculate(cart: CartItem[], products: Product[]): CalculationResult {
    // 每件商品跑過所有 strategy，取最小折扣率
  }
}
```

**新增「第二件半價」只需：**
1. 新增 `SecondItemHalfPriceDiscount` 實作 `DiscountStrategy`
2. 注入進 `CartCalculator` 的 strategies 陣列
3. 其他程式碼完全不動

---

## 七、切題性說明

| 題目要求 | 實作對應 | 切題程度 |
|----------|----------|----------|
| 商品列表表格 | DataTable 元件，含所有欄位 | ✅ 完整 |
| 分頁 10/20/50 | Pagination 元件 + pageSize 切換 | ✅ 完整 |
| 即時搜尋 | debounce hook + 名稱過濾 | ✅ 完整 |
| 篩選（分類/價格/庫存） | FilterPanel 元件 | ✅ 完整 |
| 排序 | 表頭點擊切換 asc/desc | ✅ 完整 |
| 批次操作 | checkbox 全選 + toolbar | ✅ 完整 |
| 編輯商品 | Modal + Form 表單驗證 | ✅ 完整 |
| 刪除確認框 | AlertDialog 元件 | ✅ 完整 |
| 假資料模擬 API | mockApi.ts + async/await + delay | ✅ 完整 |
| 折扣計算邏輯 | discount.ts + Strategy Pattern | ✅ 完整 |
| 折扣明細輸出 | CalculationResult 格式完整 | ✅ 完整 |
| 可擴展設計 | Strategy Pattern 說明 | ✅ 完整 |

---

## 九、開發前置：Skills 安裝

### Claude Code Skills

```bash
# UI 品質提升，避免 AI 味道太重
npx skills add https://github.com/anthropics/skills --skill frontend-design

# React 效能最佳實務，64 條規則
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices

# UX/可及性/效能 100+ 條規則
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines

# React 組合模式，元件設計更好
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-composition-patterns

# UI 元件互動最佳實務
npx skills add ibelick/ui-skills

# shadcn/ui 元件最佳實務
npx skills add shadcn/ui

# 程式碼審查，SOLID/資安/效能
npx skills add https://github.com/sanyuan0704/code-review-expert --skill code-review-expert
```

### npm 套件安裝順序

```bash
# 1. 建立專案
npm create vite@latest . -- --template react-ts

# 2. 路由
npm install react-router-dom

# 3. 狀態管理
npm install zustand

# 4. 樣式
npm install tailwindcss @tailwindcss/vite

# 5. shadcn/ui 初始化
npm install class-variance-authority clsx tailwind-merge lucide-react
npx shadcn@latest init

# 6. shadcn 元件
npx shadcn@latest add table dialog alert-dialog select input button checkbox badge form pagination

# 7. 工具套件
npm install use-debounce
npm install react-hook-form zod @hookform/resolvers
```



## 十、README 規劃

README.md 需包含：
- 專案簡介與 Demo 連結
- 技術棧說明
- 本地啟動方式
- 資料夾結構說明
- Mock API 設計說明（為何用 mock、如何替換為 Firebase）
- 題目二折扣邏輯設計思路
- 加分項目清單

---

> 此規格書為實作前確認用，確認後開始依 P0 → P1 → P2 順序開發。
