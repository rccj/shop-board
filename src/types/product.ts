export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  compareAtPrice?: number
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
  pageSize: 10 | 12 | 20 | 50 | 100 | 200
  search?: string
  categoryId?: number
  priceMin?: number
  priceMax?: number
  stockStatus?: 'in_stock' | 'out_of_stock'
  status?: 'active' | 'inactive'
  sortBy?: 'price' | 'stock' | 'sales'
  sortOrder?: 'asc' | 'desc'
}

export interface ApiResponse<T> {
  data: T
  total?: number
  page?: number
  pageSize?: number
  message?: string
}

export interface BatchUpdatePayload {
  ids: number[]
  action: 'activate' | 'deactivate' | 'delete'
}
