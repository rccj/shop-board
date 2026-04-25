# MOCK-API — Mock API 設計文件

## 一、設計原則

- 所有 API call 用 `async/await` + `Promise` 包裝，模擬真實網路請求
- 加入隨機延遲（300~600ms），模擬網路延遲
- 統一 response 格式，方便後續替換為 Firebase
- 資料存於 `localStorage`，重整不消失

---

## 二、統一格式

### Response 格式

```typescript
interface ApiResponse<T> {
  data: T
  total?: number      // 列表類才有
  page?: number
  pageSize?: number
  message?: string
}
```

### 延遲模擬

```typescript
const delay = (ms = 400) =>
  new Promise(res => setTimeout(res, ms + Math.random() * 200))
```

### 錯誤處理

```typescript
// 統一錯誤格式
interface ApiError {
  code: number
  message: string
}
// 模擬錯誤情境（找不到商品等）
if (!product) throw { code: 404, message: '商品不存在' }
```

---

## 三、端點列表

### 商品（題目一）

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/products` | 取得商品列表（含篩選、排序、分頁） |
| GET | `/products/:id` | 取得單一商品 |
| POST | `/products` | 新增單一商品 |
| POST | `/products/batch-create` | 批量新增商品（CSV 匯入） |
| PUT | `/products/:id` | 編輯商品 |
| DELETE | `/products/:id` | 刪除單一商品 |
| PATCH | `/products/batch` | 批次操作（上架/下架/刪除） |

### 購物車（題目二）

| 方法 | 端點 | 說明 |
|------|------|------|
| POST | `/cart/calculate` | 傳入購物車，回傳折扣計算結果 |

---

## 四、Request / Response 詳細格式

### GET /products

**Request Query Params：**
```typescript
interface ProductQueryParams {
  page: number          // 頁碼，從 1 開始
  pageSize: 10 | 20 | 50
  search?: string       // 商品名稱搜尋
  categoryId?: number   // 用 category.id 篩選
  priceMin?: number
  priceMax?: number
  stockStatus?: 'in_stock' | 'out_of_stock'
  status?: 'active' | 'inactive'  // 上架狀態篩選
  sortBy?: 'price' | 'stock' | 'sales'
  sortOrder?: 'asc' | 'desc'
}
```

**Response：**
```typescript
ApiResponse<Product[]>
// {
//   data: Product[],
//   total: 100,
//   page: 1,
//   pageSize: 10
// }
```

---

### POST /products

**Request Body：**
```typescript
Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
```

**Response：**
```typescript
ApiResponse<Product>
// { data: newProduct }
```

---

### POST /products/batch-create

批量新增，CSV 匯入使用。單次 API 呼叫寫入多筆，ID 自動遞增。

**Request Body：**
```typescript
Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]
```

**Response：**
```typescript
ApiResponse<Product[]>
// { data: createdProducts, message: '批量新增 N 筆成功' }
```

**限制：** 前端限制每次最多 200 筆，超過擋住不送出。

---

### PUT /products/:id

**Request Body：**
```typescript
Partial<Omit<Product, 'id'>>
```

**Response：**
```typescript
ApiResponse<Product>
// { data: updatedProduct }
```

---

### DELETE /products/:id

**Response：**
```typescript
ApiResponse<{ id: number }>
// { data: { id: 1 }, message: '刪除成功' }
```

---

### PATCH /products/batch

**Request Body：**
```typescript
interface BatchUpdatePayload {
  ids: number[]
  action: 'activate' | 'deactivate' | 'delete'
}
```

**Response：**
```typescript
ApiResponse<{ affected: number }>
// { data: { affected: 5 }, message: '批次操作成功' }
```

---

### POST /cart/calculate

**Request Body：**
```typescript
interface CalculatePayload {
  cart: CartItem[]
  // CartItem = { productId: number, quantity: number }
}
```

**Response：**
```typescript
ApiResponse<CalculationResult>
// 完整折扣計算結果，格式照 PDF 定義
```

---

## 五、localStorage 操作

```typescript
const STORAGE_KEY = 'mock_products'

// 初始化（第一次載入時 seed 假資料）
const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProducts))
  }
}

// 讀取
const getAll = (): Product[] =>
  JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')

// 寫入
const saveAll = (products: Product[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
```

---

## 六、前端處理規範

- **Loading 狀態**：每個 API call 前後切換 `isLoading`
- **Error 狀態**：catch 錯誤顯示 toast 通知
- **搜尋 debounce**：300ms，避免每個字都打 API
- **Race condition**：搜尋時若舊 request 還沒回來，忽略舊結果

---

## 七、替換 Firebase 說明

只需替換 `api/products.ts` 和 `api/cart.ts` 的實作，
其他所有元件、hooks、store 完全不用改。

```typescript
// 現在（mock）
import { getProducts } from '@/mock/handlers'

// 換 Firebase 後
import { collection, getDocs } from 'firebase/firestore'
// 只改這個檔案的實作，interface 完全相同
```
