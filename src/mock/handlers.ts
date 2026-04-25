import { Product, ProductQueryParams, BatchUpdatePayload } from '@/types/product'
import { mockProducts } from './data'

const STORAGE_KEY = 'mock_products'

const delay = (ms = 400) =>
  new Promise(res => setTimeout(res, ms + Math.random() * 200))

const getAll = (): Product[] => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProducts))
    return mockProducts
  }
  return JSON.parse(stored) as Product[]
}

const saveAll = (products: Product[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))

export const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProducts))
  }
}

export const handleGetProducts = async (params: ProductQueryParams) => {
  await delay()
  let products = getAll()

  if (params.search) {
    const q = params.search.toLowerCase()
    products = products.filter(p => p.name.toLowerCase().includes(q))
  }

  if (params.categoryId !== undefined) {
    products = products.filter(p => p.category.id === params.categoryId)
  }

  if (params.priceMin !== undefined) {
    products = products.filter(p => p.price >= params.priceMin!)
  }

  if (params.priceMax !== undefined) {
    products = products.filter(p => p.price <= params.priceMax!)
  }

  if (params.stockStatus === 'in_stock') {
    products = products.filter(p => p.stock > 0)
  } else if (params.stockStatus === 'out_of_stock') {
    products = products.filter(p => p.stock === 0)
  }

  if (params.status) {
    products = products.filter(p => p.status === params.status)
  }

  if (params.sortBy) {
    products = [...products].sort((a, b) => {
      const aVal = a[params.sortBy!]
      const bVal = b[params.sortBy!]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return params.sortOrder === 'desc' ? bVal - aVal : aVal - bVal
      }
      return 0
    })
  }

  const total = products.length
  const start = (params.page - 1) * params.pageSize
  const data = products.slice(start, start + params.pageSize)

  return { data, total, page: params.page, pageSize: params.pageSize }
}

export const handleGetProduct = async (id: number) => {
  await delay()
  const product = getAll().find(p => p.id === id)
  if (!product) throw { code: 404, message: '商品不存在' }
  return { data: product }
}

export const handleUpdateProduct = async (
  id: number,
  updates: Partial<Omit<Product, 'id'>>
) => {
  await delay()
  const products = getAll()
  const idx = products.findIndex(p => p.id === id)
  if (idx === -1) throw { code: 404, message: '商品不存在' }
  products[idx] = {
    ...products[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  saveAll(products)
  return { data: products[idx] }
}

export const handleCreateProduct = async (
  payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
) => {
  await delay()
  const products = getAll()
  const newId = Math.max(...products.map(p => p.id), 0) + 1
  const now = new Date().toISOString()
  const newProduct: Product = {
    ...payload,
    id: newId,
    createdAt: now,
    updatedAt: now,
  }
  products.push(newProduct)
  saveAll(products)
  return { data: newProduct }
}

export const handleDeleteProduct = async (id: number) => {
  await delay()
  const products = getAll()
  const idx = products.findIndex(p => p.id === id)
  if (idx === -1) throw { code: 404, message: '商品不存在' }
  products.splice(idx, 1)
  saveAll(products)
  return { data: { id }, message: '刪除成功' }
}

export const handleBatchCreate = async (
  payloads: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]
) => {
  await delay()
  const products = getAll()
  const now = new Date().toISOString()
  let nextId = Math.max(...products.map(p => p.id), 0) + 1
  const created: Product[] = payloads.map(payload => ({
    ...payload,
    id: nextId++,
    createdAt: now,
    updatedAt: now,
  }))
  saveAll([...products, ...created])
  return { data: created, message: `批量新增 ${created.length} 筆成功` }
}

export const handleBatchUpdate = async (payload: BatchUpdatePayload) => {
  await delay()
  const products = getAll()

  if (payload.action === 'delete') {
    const filtered = products.filter(p => !payload.ids.includes(p.id))
    saveAll(filtered)
  } else {
    const now = new Date().toISOString()
    const status = payload.action === 'activate' ? 'active' : 'inactive'
    products.forEach(p => {
      if (payload.ids.includes(p.id)) {
        p.status = status
        p.updatedAt = now
      }
    })
    saveAll(products)
  }

  return { data: { affected: payload.ids.length }, message: '批次操作成功' }
}
