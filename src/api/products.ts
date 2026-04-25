import { Product, ProductQueryParams, BatchUpdatePayload } from '@/types/product'
import {
  handleGetProducts,
  handleGetProduct,
  handleUpdateProduct,
  handleCreateProduct,
  handleBatchCreate,
  handleDeleteProduct,
  handleBatchUpdate,
} from '@/mock/handlers'

export const getProducts = (params: ProductQueryParams) =>
  handleGetProducts(params)

export const getProduct = (id: number) => handleGetProduct(id)

export const createProduct = (payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
  handleCreateProduct(payload)

export const updateProduct = (id: number, updates: Partial<Omit<Product, 'id'>>) =>
  handleUpdateProduct(id, updates)

export const deleteProduct = (id: number) => handleDeleteProduct(id)

export const batchCreateProducts = (
  payloads: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]
) => handleBatchCreate(payloads)

export const batchUpdateProducts = (payload: BatchUpdatePayload) =>
  handleBatchUpdate(payload)
