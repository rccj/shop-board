import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/shop-board/#/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/shop-board/#/products/1')
  await page.getByRole('button', { name: /加入購物車/ }).first().click()
  await page.getByText('已加入購物車').click()
  await expect(page.getByRole('heading', { name: /購物車/ })).toBeVisible()
})

test.describe('購物車 Drawer', () => {
  test('加入商品後數量顯示正確', async ({ page }) => {
    await expect(page.locator('span.absolute').filter({ hasText: '1' })).toBeVisible()
  })

  test('點 + 增加數量', async ({ page }) => {
    await page.getByTestId('cart-plus').first().click()
    // quantity shown as plain number in span
    await expect(page.locator('span.w-6.text-center').filter({ hasText: '2' })).toBeVisible()
  })

  test('數量 1 時點 − 顯示確認 Popover', async ({ page }) => {
    await page.getByTestId('cart-minus').first().click()
    await expect(page.getByText(/確定移除此商品/)).toBeVisible()
  })

  test('垃圾桶按鈕顯示確認 Popover', async ({ page }) => {
    await page.getByTestId('cart-trash').first().click()
    await expect(page.getByText(/確定移除此商品/)).toBeVisible()
  })

  test('確認移除後商品消失', async ({ page }) => {
    await page.getByTestId('cart-trash').first().click()
    await page.getByRole('button', { name: '確定' }).click()
    await expect(page.getByText('購物車是空的')).toBeVisible()
  })

  test('取消移除後商品仍在', async ({ page }) => {
    await page.getByTestId('cart-trash').first().click()
    await page.getByRole('button', { name: '取消' }).click()
    await expect(page.getByTestId('cart-trash').first()).toBeVisible()
  })

  test('前往結帳按鈕可點擊且導頁', async ({ page }) => {
    await page.getByRole('link', { name: '前往結帳' }).click()
    await expect(page).toHaveURL(/#\/checkout/)
  })
})

test.describe('購物車折扣顯示', () => {
  test('電子3C 買 2 件觸發分類折扣', async ({ page }) => {
    await page.getByTestId('cart-plus').first().click()
    await expect(page.locator('span.w-6.text-center').filter({ hasText: '2' })).toBeVisible()
    await expect(page.locator('text=折扣優惠')).toBeVisible()
  })

  test('有折扣時可展開明細', async ({ page }) => {
    await page.getByTestId('cart-plus').first().click()
    await page.locator('button').filter({ hasText: '折扣優惠' }).click()
    await expect(page.locator('text=/分類\\d折|第二件半價|滿額9折/').first()).toBeVisible()
  })

  test('第二件半價 label 可見', async ({ page }) => {
    await page.getByTestId('cart-plus').first().click()
    await page.locator('button').filter({ hasText: '折扣優惠' }).click()
    await expect(page.locator('.text-green-600').first()).toBeVisible()
  })

  test('滿額進度條顯示', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]').or(page.locator('.bg-green-500')).first()).toBeVisible()
  })
})
