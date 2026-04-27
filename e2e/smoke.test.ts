import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/shop-board/#/')
  await page.evaluate(() => localStorage.clear())
})

test.describe('Smoke Tests', () => {
  test('S1 — 首頁商品列表載入', async ({ page }) => {
    await page.goto('/shop-board/#/')
    await expect(page.locator('h1').filter({ hasText: 'Shop Board' })).toBeVisible()
    await expect(page.getByText('熱銷商品')).toBeVisible()
    await expect(page.getByText('所有商品')).toBeVisible()
    // product cards rendered
    await expect(page.locator('.grid').first()).not.toBeEmpty()
  })

  test('S2 — 點擊商品進入詳情頁', async ({ page }) => {
    await page.goto('/shop-board/#/')
    // click first product card image link
    await page.locator('a[href*="/products/"]').first().click()
    await expect(page).toHaveURL(/#\/products\/\d+/)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByRole('button', { name: /加入購物車/ })).toBeVisible()
  })

  test('S3 — 詳情頁加入購物車，Toast 出現', async ({ page }) => {
    await page.goto('/shop-board/#/products/1')
    await page.getByRole('button', { name: /加入購物車/ }).click()
    await expect(page.getByText('已加入購物車')).toBeVisible()
  })

  test('S4 — 點擊 Toast 開啟購物車', async ({ page }) => {
    await page.goto('/shop-board/#/products/1')
    await page.getByRole('button', { name: /加入購物車/ }).click()
    const toast = page.getByText('已加入購物車')
    await expect(toast).toBeVisible()
    await toast.click()
    await expect(page.getByRole('heading', { name: /購物車/ })).toBeVisible()
  })

  test('S5 — 前往結帳按鈕可點擊', async ({ page }) => {
    await page.goto('/shop-board/#/products/1')
    await page.getByRole('button', { name: /加入購物車/ }).click()
    await page.getByText('已加入購物車').click()
    await page.getByRole('link', { name: '前往結帳' }).click()
    await expect(page).toHaveURL(/#\/checkout/)
  })

  test('S6 — 後台商品列表載入', async ({ page }) => {
    await page.goto('/shop-board/#/admin/products')
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('row').nth(1)).toBeVisible()
  })

  test('S7 — 重整頁面購物車仍在（localStorage 持久化）', async ({ page }) => {
    await page.goto('/shop-board/#/products/1')
    await page.getByRole('button', { name: /加入購物車/ }).click()
    // wait for cart count badge
    await expect(page.locator('span.absolute').filter({ hasText: '1' })).toBeVisible()
    await page.reload()
    await expect(page.locator('span.absolute').filter({ hasText: '1' })).toBeVisible()
  })
})
