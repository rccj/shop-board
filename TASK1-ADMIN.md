# TASK1-ADMIN — 題目一：商品管理系統

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

## 二、TypeScript Interface

```typescript
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
  category: Category
  images: string[]
  stock: number
  lowStockThreshold: number
  sales: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface ProductQueryParams {
  page: number
  pageSize: 10 | 20 | 50
  search?: string
  categoryId?: number
  priceMin?: number
  priceMax?: number
  stockStatus?: 'in_stock' | 'out_of_stock'
  status?: 'active' | 'inactive'
  sortBy?: 'price' | 'stock' | 'sales'
  sortOrder?: 'asc' | 'desc'
}
```

---

## 三、Mock 假資料

6 個分類，30 筆商品，存於 `localStorage` 持久化。

```typescript
export const categories: Category[] = [
  { id: 1, name: '3C電子' },
  { id: 2, name: '服飾配件' },
  { id: 3, name: '居家生活' },
  { id: 4, name: '美妝保養' },
  { id: 5, name: '運動戶外' },
  { id: 6, name: '書籍文具' },
]
```

---

## 四、元件結構

```
pages/admin/Products.tsx
├── components/admin/
│   ├── ProductFilters.tsx        # 篩選 + 搜尋（同一區塊）
│   ├── ProductTable.tsx          # 商品表格（含 inline 狀態 toggle）
│   ├── BatchActionToolbar.tsx    # 批次操作懸浮 pill（底部）
│   ├── ProductAddModal.tsx       # 新增商品（含圖片上傳）
│   ├── ProductEditModal.tsx      # 編輯商品（含圖片上傳）
│   ├── ProductDeleteDialog.tsx   # 單筆刪除確認
│   └── ProductBulkImportModal.tsx # CSV 批量匯入
```

---

## 五、資料流

```
useProducts hook
  └── 管理所有查詢狀態（search / filters / sort / page）
      ├── getProducts / createProduct / updateProduct / deleteProduct
      ├── batchCreateProducts（CSV 匯入）
      ├── batchUpdateProducts（批次上架/下架/刪除）
      └── 回傳 { products, total, isLoading, error }

Zustand productStore
  └── 存放選取中的商品 ids（批次操作用）
```

---

## 六、關鍵實作

### 即時搜尋

```typescript
const [debouncedSearch] = useDebounce(search, 300)
// debouncedSearch 變化時頁碼重置回第 1 頁
```

### 排序

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

### 批次操作

```typescript
const handleBatch = async (action: 'activate' | 'deactivate' | 'delete') => {
  if (action === 'delete') { setBatchDeleteOpen(true); return }
  await handleBatch({ ids: selectedIds, action })
  clearSelection()
}
```

---

## 七、注意事項

- 篩選、搜尋、排序改變時，頁碼重置回第 1 頁
- 批次操作後清空選取狀態
- 刪除後若當前頁變空，跳回上一頁
- `images` 是陣列，顯示 `images[0]`
- `compareAtPrice` 有值時顯示原價刪除線
- `stock ≤ lowStockThreshold` 時顯示低庫存警示（△ + tooltip）
- 篩選分類用 `category.id`，不是字串
