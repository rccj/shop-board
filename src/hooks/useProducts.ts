import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from 'use-debounce'
import { Product, ProductQueryParams } from '@/types/product'
import {
  getProducts,
  updateProduct,
  deleteProduct,
  batchUpdateProducts,
  batchCreateProducts,
  createProduct,
} from '@/api/products'
import { BatchUpdatePayload } from '@/types/product'

const defaultParams: ProductQueryParams = {
  page: 1,
  pageSize: 10,
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 300)
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [priceMin, setPriceMin] = useState<number | undefined>()
  const [priceMax, setPriceMax] = useState<number | undefined>()
  const [stockStatus, setStockStatus] = useState<ProductQueryParams['stockStatus']>()
  const [status, setStatus] = useState<ProductQueryParams['status']>()
  const [sortBy, setSortBy] = useState<ProductQueryParams['sortBy']>()
  const [sortOrder, setSortOrder] = useState<ProductQueryParams['sortOrder']>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(10)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: ProductQueryParams = {
        page,
        pageSize,
        search: debouncedSearch || undefined,
        categoryId,
        priceMin,
        priceMax,
        stockStatus,
        status,
        sortBy,
        sortOrder,
      }
      const res = await getProducts(params)
      setProducts(res.data)
      setTotal(res.total ?? 0)
    } catch {
      setError('載入商品失敗')
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, debouncedSearch, categoryId, priceMin, priceMax, stockStatus, status, sortBy, sortOrder])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoryId, priceMin, priceMax, stockStatus, status, sortBy, sortOrder, pageSize])

  const handleSort = (field: NonNullable<ProductQueryParams['sortBy']>) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleUpdate = async (id: number, updates: Partial<Omit<Product, 'id'>>) => {
    await updateProduct(id, updates)
    await fetchProducts()
  }

  const handleCreate = async (payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createProduct(payload)
    await fetchProducts()
  }

  const handleDelete = async (id: number) => {
    await deleteProduct(id)
    const newTotal = total - 1
    const maxPage = Math.max(1, Math.ceil(newTotal / pageSize))
    if (page > maxPage) setPage(maxPage)
    await fetchProducts()
  }

  const handleBatch = async (payload: BatchUpdatePayload) => {
    await batchUpdateProducts(payload)
    await fetchProducts()
  }

  const handleBatchCreate = async (
    payloads: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]
  ) => {
    await batchCreateProducts(payloads)
    await fetchProducts()
  }

  return {
    products,
    total,
    isLoading,
    error,
    search,
    setSearch,
    categoryId,
    setCategoryId,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    stockStatus,
    setStockStatus,
    status,
    setStatus,
    sortBy,
    sortOrder,
    handleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    refetch: fetchProducts,
    handleUpdate,
    handleCreate,
    handleBatchCreate,
    handleDelete,
    handleBatch,
  }
}
