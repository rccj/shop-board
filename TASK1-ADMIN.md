# TASK1-ADMIN — 題目一：商品管理系統實作筆記

## 一、題目要求

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

## 二、Product Interface（題目已給定，以此為準）

```typescript
// types/product.ts

export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  compareAtPrice?: number        // 原價（選填，用於顯示折扣）
  category: Category             // 物件，非字串
  images: string[]               // 陣列
  stock: number
  lowStockThreshold: number      // 低庫存警示門檻
  sales: number
  status: 'active' | 'inactive'
  createdAt: string              // ISO 8601
  updatedAt: string              // ISO 8601
}

export interface ProductQueryParams {
  page: number
  pageSize: 10 | 20 | 50
  search?: string
  categoryId?: number
  priceMin?: number
  priceMax?: number
  stockStatus?: 'in_stock' | 'out_of_stock'
  sortBy?: 'price' | 'stock' | 'sales'
  sortOrder?: 'asc' | 'desc'
}
```

**與原本設計的差異（重要）：**

| 欄位 | 原本設計 | 實際格式 |
|------|---------|---------|
| `category` | `'electronics' \| 'clothing' \| 'books'` 字串 | `{ id: number, name: string }` 物件 |
| `images` | `string` 單一字串 | `string[]` 陣列 |
| 分類數量 | 3 個 | 6 個（3C電子/服飾配件/居家生活/美妝保養/運動戶外/書籍文具） |
| `description` | ❌ 無 | ✅ 有 |
| `compareAtPrice` | ❌ 無 | ✅ 有（選填） |
| `lowStockThreshold` | ❌ 無 | ✅ 有 |
| `createdAt` / `updatedAt` | ❌ 無 | ✅ 有 |

---

## 三、Mock 假資料

**題目已提供完整 30 筆假資料**，直接使用，不需自行設計：

```typescript
// mockData.ts
export const categories: Category[] = [
  { id: 1, name: '3C電子' },
  { id: 2, name: '服飾配件' },
  { id: 3, name: '居家生活' },
  { id: 4, name: '美妝保養' },
  { id: 5, name: '運動戶外' },
  { id: 6, name: '書籍文具' },
]

export const products: Product[] = [
  // 完整 30 筆，直接從題目複製
]
```

---

## 四、元件拆分

```
pages/admin/Products.tsx          # 主頁面，組合所有元件
├── components/admin/
│   ├── ProductTable.tsx          # 商品表格主體
│   ├── ProductTableRow.tsx       # 單行商品
│   ├── ProductFilters.tsx        # 篩選面板（分類/價格/庫存）
│   ├── ProductSearch.tsx         # 搜尋欄位
│   ├── ProductPagination.tsx     # 分頁元件
│   ├── BatchActionToolbar.tsx    # 批次操作工具列（勾選後出現）
│   ├── ProductEditModal.tsx      # 編輯商品 Modal
│   └── ProductDeleteDialog.tsx   # 刪除確認 AlertDialog
```

---

## 五、資料流設計

```
useProducts hook
  └── 管理所有查詢狀態（search / filters / sort / page）
      ├── 呼叫 api/products.ts → getProducts(params)
      ├── 回傳 { products, total, isLoading, error }
      └── 提供 updateProduct / deleteProduct / batchUpdate 方法

Zustand productStore
  └── 存放選取中的商品 ids（批次操作用）
```

---

## 六、各功能實作細節

### 5.1 即時搜尋

```typescript
import { useDebounce } from 'use-debounce'

const [searchInput, setSearchInput] = useState('')
const [debouncedSearch] = useDebounce(searchInput, 300)

// debouncedSearch 變化時才打 API
useEffect(() => {
  fetchProducts({ search: debouncedSearch, page: 1 })
}, [debouncedSearch])
```

### 5.2 排序

表頭點擊切換，同一欄位再點一次切換 asc/desc：

```typescript
const handleSort = (field: 'price' | 'stock' | 'sales') => {
  if (sortBy === field) {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  } else {
    setSortBy(field)
    setSortOrder('asc')
  }
}
```

### 5.3 批次操作

```typescript
// 全選邏輯
const isAllSelected = selectedIds.length === products.length
const toggleAll = () =>
  isAllSelected ? clearSelection() : selectAll(products.map(p => p.id))

// 批次操作
const handleBatch = async (action: 'activate' | 'deactivate' | 'delete') => {
  await batchUpdate({ ids: selectedIds, action })
  clearSelection()
  refetch()
}
```

### 5.4 編輯商品

- 點擊編輯 → 開啟 Modal，預填現有資料
- 使用 `react-hook-form` + `zod` 做表單驗證
- 儲存後呼叫 `updateProduct`，關閉 Modal，重新拉資料

### 5.5 刪除商品

- 點擊刪除 → 開啟 `AlertDialog` 確認框
- 確認後呼叫 `deleteProduct`，關閉 Dialog，重新拉資料

---

## 七、實作 Checklist

### P0 核心
- [ ] `types/product.ts` interface 定義（照題目格式）
- [ ] `mock/data.ts` 直接使用題目提供的 30 筆假資料
- [ ] `mock/handlers.ts` localStorage CRUD 操作
- [ ] `api/products.ts` API 層封裝
- [ ] `useProducts` hook
- [ ] `ProductTable` 表格元件（含所有欄位）
- [ ] 分頁（pageSize 10/20/50 切換）
- [ ] 即時搜尋（debounce 300ms）
- [ ] 篩選面板（分類 6 個 / 價格區間 / 庫存狀態）
- [ ] 排序（價格 / 庫存 / 銷量，點擊表頭切換）
- [ ] 批次上架 / 下架 / 刪除
- [ ] 編輯商品 Modal（react-hook-form + zod）
- [ ] 刪除確認 AlertDialog

### P1 加分
- [ ] 新增商品（後台）
- [ ] Loading skeleton
- [ ] 空狀態（無搜尋結果）
- [ ] 低庫存警示（stock ≤ lowStockThreshold 時標示）
- [ ] RWD

---

## 八、注意事項

- 篩選、搜尋、排序改變時，頁碼要重置回第 1 頁
- 批次操作後要清空選取狀態
- 刪除後若當前頁變空，要跳回上一頁
- `images` 是陣列，顯示第一張 `images[0]` 即可
- `compareAtPrice` 選填，有值時顯示原價刪除線
- `stock ≤ lowStockThreshold` 時顯示低庫存警示
- 篩選分類時用 `category.id` 比對，不是字串
