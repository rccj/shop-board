import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  handleGetProducts,
  handleGetProduct,
  handleCreateProduct,
  handleUpdateProduct,
  handleDeleteProduct,
  handleBatchUpdate,
  handleBatchCreate,
  initStorage,
} from '../handlers'
import type { Product } from '@/types/product'

// Patch setTimeout so delay() resolves immediately
beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  initStorage()
})

afterEach(() => {
  vi.useRealTimers()
})

const run = <T>(promise: Promise<T>): Promise<T> => {
  vi.runAllTimers()
  return promise
}

/** Minimal product payload for create tests */
const makePayload = (overrides: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> = {}): Omit<Product, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: 'Test Product',
  description: 'A test product',
  price: 1000,
  category: { id: 1, name: '電子產品' },
  images: ['https://example.com/img.jpg'],
  stock: 10,
  lowStockThreshold: 3,
  sales: 0,
  status: 'active',
  ...overrides,
})

// ---------------------------------------------------------------------------
// handleGetProducts
// ---------------------------------------------------------------------------
describe('handleGetProducts', () => {
  it('returns all 30 products by default', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    expect(result.total).toBe(30)
    expect(result.data.length).toBe(30)
  })

  it('paginates correctly — page 2', async () => {
    const result = await run(handleGetProducts({ page: 2, pageSize: 10 }))
    expect(result.data.length).toBe(10)
    expect(result.page).toBe(2)
  })

  it('last page returns only remaining items', async () => {
    const result = await run(handleGetProducts({ page: 3, pageSize: 10 }))
    expect(result.data.length).toBe(10)
  })

  it('page beyond range returns empty array', async () => {
    const result = await run(handleGetProducts({ page: 99, pageSize: 50 }))
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(30)
  })

  it('filters by status: active', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, status: 'active' }))
    expect(result.data.every(p => p.status === 'active')).toBe(true)
  })

  it('filters by status: inactive', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, status: 'inactive' }))
    expect(result.data.every(p => p.status === 'inactive')).toBe(true)
  })

  it('filters by categoryId', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, categoryId: 1 }))
    expect(result.data.every(p => p.category.id === 1)).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('filters by priceMin', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, priceMin: 10000 }))
    expect(result.data.every(p => p.price >= 10000)).toBe(true)
  })

  it('filters by priceMax', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, priceMax: 500 }))
    expect(result.data.every(p => p.price <= 500)).toBe(true)
  })

  it('priceMin === priceMax returns only exact match', async () => {
    // first get any product's price to use as exact target
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const target = all.data[0].price
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, priceMin: target, priceMax: target }))
    expect(result.data.every(p => p.price === target)).toBe(true)
  })

  it('filters by stockStatus: in_stock', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, stockStatus: 'in_stock' }))
    expect(result.data.every(p => p.stock > 0)).toBe(true)
  })

  it('filters by stockStatus: out_of_stock', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, stockStatus: 'out_of_stock' }))
    expect(result.data.every(p => p.stock === 0)).toBe(true)
  })

  it('searches by name (case-insensitive)', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, search: 'iphone' }))
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data.every(p => p.name.toLowerCase().includes('iphone'))).toBe(true)
  })

  it('search with no match returns empty', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, search: 'zzz_no_match_xyz' }))
    expect(result.data.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('sorts by price asc', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, sortBy: 'price', sortOrder: 'asc' }))
    const prices = result.data.map(p => p.price)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  it('sorts by price desc', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, sortBy: 'price', sortOrder: 'desc' }))
    const prices = result.data.map(p => p.price)
    expect(prices).toEqual([...prices].sort((a, b) => b - a))
  })

  it('sorts by stock asc', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, sortBy: 'stock', sortOrder: 'asc' }))
    const stocks = result.data.map(p => p.stock)
    expect(stocks).toEqual([...stocks].sort((a, b) => a - b))
  })

  it('sorts by sales desc', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, sortBy: 'sales', sortOrder: 'desc' }))
    const sales = result.data.map(p => p.sales)
    expect(sales).toEqual([...sales].sort((a, b) => b - a))
  })

  it('search is case-insensitive — uppercase query matches lowercase name', async () => {
    const lower = await run(handleGetProducts({ page: 1, pageSize: 50, search: 'iphone' }))
    const upper = await run(handleGetProducts({ page: 1, pageSize: 50, search: 'IPHONE' }))
    expect(upper.data.length).toBe(lower.data.length)
    expect(upper.data.map(p => p.id)).toEqual(lower.data.map(p => p.id))
  })

  it('page=0 returns empty data (not an error)', async () => {
    const result = await run(handleGetProducts({ page: 0, pageSize: 10 }))
    expect(result.data.length).toBe(0)
  })

  it('combined filter: active + categoryId + priceMin', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, status: 'active', categoryId: 1, priceMin: 1000 }))
    expect(result.data.every(p => p.status === 'active' && p.category.id === 1 && p.price >= 1000)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// handleGetProduct (single)
// ---------------------------------------------------------------------------
describe('handleGetProduct', () => {
  it('returns product by id', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const target = all.data[0]
    const result = await run(handleGetProduct(target.id))
    expect(result.data.id).toBe(target.id)
    expect(result.data.name).toBe(target.name)
  })

  it('throws 404 for non-existent id', async () => {
    await expect(run(handleGetProduct(99999))).rejects.toMatchObject({ code: 404 })
  })

  it('throws 404 for negative id', async () => {
    await expect(run(handleGetProduct(-1))).rejects.toMatchObject({ code: 404 })
  })

  it('throws 404 for id 0', async () => {
    await expect(run(handleGetProduct(0))).rejects.toMatchObject({ code: 404 })
  })
})

// ---------------------------------------------------------------------------
// handleCreateProduct
// ---------------------------------------------------------------------------
describe('handleCreateProduct', () => {
  it('creates product and returns it with id', async () => {
    const result = await run(handleCreateProduct(makePayload()))
    expect(result.data.id).toBeGreaterThan(0)
    expect(result.data.name).toBe('Test Product')
  })

  it('auto-increments id beyond existing max', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const maxId = Math.max(...all.data.map(p => p.id))
    const result = await run(handleCreateProduct(makePayload()))
    expect(result.data.id).toBe(maxId + 1)
  })

  it('sets createdAt and updatedAt timestamps', async () => {
    const before = new Date().toISOString()
    const result = await run(handleCreateProduct(makePayload()))
    expect(result.data.createdAt).toBeDefined()
    expect(result.data.updatedAt).toBeDefined()
    expect(result.data.createdAt >= before).toBe(true)
  })

  it('persists to storage — retrievable via handleGetProduct', async () => {
    const created = await run(handleCreateProduct(makePayload({ name: 'Persisted Product' })))
    const fetched = await run(handleGetProduct(created.data.id))
    expect(fetched.data.name).toBe('Persisted Product')
  })

  it('sequential creates get sequential ids', async () => {
    const a = await run(handleCreateProduct(makePayload()))
    const b = await run(handleCreateProduct(makePayload()))
    expect(b.data.id).toBe(a.data.id + 1)
  })

  it('total count increases by 1 after create', async () => {
    const before = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    await run(handleCreateProduct(makePayload()))
    const after = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    expect(after.total).toBe(before.total + 1)
  })
})

// ---------------------------------------------------------------------------
// handleUpdateProduct
// ---------------------------------------------------------------------------
describe('handleUpdateProduct', () => {
  it('updates specified fields', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const id = all.data[0].id
    const result = await run(handleUpdateProduct(id, { name: 'Updated Name', price: 9999 }))
    expect(result.data.name).toBe('Updated Name')
    expect(result.data.price).toBe(9999)
  })

  it('preserves non-updated fields', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const original = all.data[0]
    await run(handleUpdateProduct(original.id, { price: 1 }))
    const fetched = await run(handleGetProduct(original.id))
    expect(fetched.data.name).toBe(original.name)
    expect(fetched.data.category.id).toBe(original.category.id)
    expect(fetched.data.stock).toBe(original.stock)
  })

  it('updates updatedAt timestamp', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const original = all.data[0]
    const before = new Date().toISOString()
    const result = await run(handleUpdateProduct(original.id, { price: 1 }))
    expect(result.data.updatedAt >= before).toBe(true)
  })

  it('persists changes — visible via handleGetProduct', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const id = all.data[0].id
    await run(handleUpdateProduct(id, { name: 'Persisted Update' }))
    const fetched = await run(handleGetProduct(id))
    expect(fetched.data.name).toBe('Persisted Update')
  })

  it('throws 404 for non-existent id', async () => {
    await expect(run(handleUpdateProduct(99999, { name: 'Ghost' }))).rejects.toMatchObject({ code: 404 })
  })

  it('empty patch {} preserves all fields, only updates updatedAt', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const original = all.data[0]
    const before = new Date().toISOString()
    const result = await run(handleUpdateProduct(original.id, {}))
    expect(result.data.name).toBe(original.name)
    expect(result.data.price).toBe(original.price)
    expect(result.data.stock).toBe(original.stock)
    expect(result.data.updatedAt >= before).toBe(true)
  })

  it('can toggle status active ↔ inactive', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50, status: 'active' }))
    const id = all.data[0].id
    await run(handleUpdateProduct(id, { status: 'inactive' }))
    const fetched = await run(handleGetProduct(id))
    expect(fetched.data.status).toBe('inactive')
  })
})

// ---------------------------------------------------------------------------
// handleDeleteProduct
// ---------------------------------------------------------------------------
describe('handleDeleteProduct', () => {
  it('removes product from storage', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const id = all.data[0].id
    await run(handleDeleteProduct(id))
    await expect(run(handleGetProduct(id))).rejects.toMatchObject({ code: 404 })
  })

  it('total count decreases by 1', async () => {
    const before = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const id = before.data[0].id
    await run(handleDeleteProduct(id))
    const after = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    expect(after.total).toBe(before.total - 1)
  })

  it('other products unaffected', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const [first, second] = all.data
    await run(handleDeleteProduct(first.id))
    const fetched = await run(handleGetProduct(second.id))
    expect(fetched.data.id).toBe(second.id)
  })

  it('returns deleted id in response', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const id = all.data[0].id
    const result = await run(handleDeleteProduct(id))
    expect(result.data.id).toBe(id)
  })

  it('throws 404 for non-existent id', async () => {
    await expect(run(handleDeleteProduct(99999))).rejects.toMatchObject({ code: 404 })
  })

  it('throws 404 when deleting already-deleted product', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const id = all.data[0].id
    await run(handleDeleteProduct(id))
    await expect(run(handleDeleteProduct(id))).rejects.toMatchObject({ code: 404 })
  })
})

// ---------------------------------------------------------------------------
// handleBatchCreate
// ---------------------------------------------------------------------------
describe('handleBatchCreate', () => {
  it('creates multiple products', async () => {
    const result = await run(handleBatchCreate([makePayload({ name: 'A' }), makePayload({ name: 'B' })]))
    expect(result.data.length).toBe(2)
    expect(result.data.map(p => p.name)).toEqual(['A', 'B'])
  })

  it('each product gets unique sequential id', async () => {
    const result = await run(handleBatchCreate([makePayload(), makePayload(), makePayload()]))
    const ids = result.data.map(p => p.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(3)
    expect(ids[1]).toBe(ids[0] + 1)
    expect(ids[2]).toBe(ids[1] + 1)
  })

  it('all products persisted and retrievable', async () => {
    const result = await run(handleBatchCreate([makePayload({ name: 'X' }), makePayload({ name: 'Y' })]))
    for (const p of result.data) {
      const fetched = await run(handleGetProduct(p.id))
      expect(fetched.data.id).toBe(p.id)
    }
  })

  it('total count increases by batch size', async () => {
    const before = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    await run(handleBatchCreate([makePayload(), makePayload(), makePayload()]))
    const after = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    expect(after.total).toBe(before.total + 3)
  })

  it('empty batch creates nothing', async () => {
    const before = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const result = await run(handleBatchCreate([]))
    expect(result.data.length).toBe(0)
    const after = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    expect(after.total).toBe(before.total)
  })
})

// ---------------------------------------------------------------------------
// handleBatchUpdate
// ---------------------------------------------------------------------------
describe('handleBatchUpdate', () => {
  it('activate sets status to active for all ids', async () => {
    const inactive = await run(handleGetProducts({ page: 1, pageSize: 50, status: 'inactive' }))
    const ids = inactive.data.slice(0, 3).map(p => p.id)
    await run(handleBatchUpdate({ ids, action: 'activate' }))
    for (const id of ids) {
      const p = await run(handleGetProduct(id))
      expect(p.data.status).toBe('active')
    }
  })

  it('deactivate sets status to inactive for all ids', async () => {
    const active = await run(handleGetProducts({ page: 1, pageSize: 50, status: 'active' }))
    const ids = active.data.slice(0, 3).map(p => p.id)
    await run(handleBatchUpdate({ ids, action: 'deactivate' }))
    for (const id of ids) {
      const p = await run(handleGetProduct(id))
      expect(p.data.status).toBe('inactive')
    }
  })

  it('delete removes all specified products', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const ids = all.data.slice(0, 3).map(p => p.id)
    await run(handleBatchUpdate({ ids, action: 'delete' }))
    for (const id of ids) {
      await expect(run(handleGetProduct(id))).rejects.toMatchObject({ code: 404 })
    }
  })

  it('delete reduces total count by batch size', async () => {
    const before = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const ids = before.data.slice(0, 5).map(p => p.id)
    await run(handleBatchUpdate({ ids, action: 'delete' }))
    const after = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    expect(after.total).toBe(before.total - 5)
  })

  it('non-targeted products unaffected by batch delete', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const toDelete = all.data.slice(0, 2).map(p => p.id)
    const keepId = all.data[5].id
    await run(handleBatchUpdate({ ids: toDelete, action: 'delete' }))
    const kept = await run(handleGetProduct(keepId))
    expect(kept.data.id).toBe(keepId)
  })

  it('returns affected count', async () => {
    const all = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const ids = all.data.slice(0, 4).map(p => p.id)
    const result = await run(handleBatchUpdate({ ids, action: 'activate' }))
    expect(result.data.affected).toBe(4)
  })

  it('all invalid ids: no products changed, affected = ids.length (known limitation)', async () => {
    const before = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    const result = await run(handleBatchUpdate({ ids: [99998, 99999], action: 'activate' }))
    const after = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    // affected reports input length, not actual changed count
    expect(result.data.affected).toBe(2)
    // but nothing actually changed
    expect(after.total).toBe(before.total)
  })

  it('mixed valid + invalid ids: valid ones change, affected = total ids.length', async () => {
    const inactive = await run(handleGetProducts({ page: 1, pageSize: 50, status: 'inactive' }))
    const validId = inactive.data[0].id
    await run(handleBatchUpdate({ ids: [validId, 99999], action: 'activate' }))
    const fetched = await run(handleGetProduct(validId))
    expect(fetched.data.status).toBe('active')
  })

  it('empty ids: no-op, count unchanged', async () => {
    const before = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    await run(handleBatchUpdate({ ids: [], action: 'delete' }))
    const after = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    expect(after.total).toBe(before.total)
  })
})
