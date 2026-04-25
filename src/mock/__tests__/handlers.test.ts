import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleGetProducts, initStorage } from '../handlers'

// Speed up delay() in handlers
vi.mock('../handlers', async importOriginal => {
  const mod = await importOriginal<typeof import('../handlers')>()
  return mod
})

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

describe('handleGetProducts', () => {
  it('returns all 30 products by default', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50 }))
    expect(result.total).toBe(30)
    expect(result.data.length).toBe(30)
  })

  it('paginates correctly', async () => {
    const result = await run(handleGetProducts({ page: 2, pageSize: 10 }))
    expect(result.data.length).toBe(10)
    expect(result.page).toBe(2)
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

  it('filters by stockStatus: in_stock', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, stockStatus: 'in_stock' }))
    expect(result.data.every(p => p.stock > 0)).toBe(true)
  })

  it('searches by name (case-insensitive)', async () => {
    const result = await run(handleGetProducts({ page: 1, pageSize: 50, search: 'iphone' }))
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data.every(p => p.name.toLowerCase().includes('iphone'))).toBe(true)
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
})
