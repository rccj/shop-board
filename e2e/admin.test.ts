import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/shop-board/#/')
  await page.evaluate(() => {
    localStorage.clear()
    // Inject mock admin token so AdminGuard passes
    localStorage.setItem('admin-auth', JSON.stringify({ state: { token: 'e2e-test-token' }, version: 0 }))
  })
  await page.goto('/shop-board/#/admin/products')
  await expect(page.getByRole('table')).toBeVisible()
})

test.describe('後台商品列表', () => {
  test('顯示商品列表', async ({ page }) => {
    const rows = await page.getByRole('row').count()
    expect(rows).toBeGreaterThan(2)
  })

  test('搜尋過濾', async ({ page }) => {
    await page.getByPlaceholder('搜尋商品名稱…').fill('iphone')
    await page.waitForTimeout(1200)
    const rows = await page.getByRole('row').count()
    expect(rows).toBeGreaterThanOrEqual(2)
  })

  test('狀態篩選 — 已下架', async ({ page }) => {
    await page.locator('label', { hasText: '上架狀態' }).locator('..').getByRole('combobox').click()
    await page.getByRole('option', { name: '已下架' }).click()
    await page.waitForTimeout(800)
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('排序欄位點擊', async ({ page }) => {
    await page.getByRole('columnheader', { name: /價格/ }).click()
    await page.waitForTimeout(300)
    await expect(page.getByRole('table')).toBeVisible()
  })
})

test.describe('後台 — 新增商品', () => {
  test('開啟新增商品表單', async ({ page }) => {
    await page.getByRole('button', { name: /新增商品/ }).first().click()
    await expect(page.getByRole('dialog', { name: '新增商品' })).toBeVisible()
  })

  test('必填欄位驗證 — 空表單無法送出', async ({ page }) => {
    await page.getByRole('button', { name: /新增商品/ }).first().click()
    const dialog = page.getByRole('dialog', { name: '新增商品' })
    await dialog.getByRole('button', { name: '新增商品' }).click()
    await expect(dialog).toBeVisible()
  })

  test('填入資料後新增成功', async ({ page }) => {
    await page.getByRole('button', { name: /新增商品/ }).first().click()
    const dialog = page.getByRole('dialog', { name: '新增商品' })
    await dialog.getByLabel('商品名稱').fill('測試商品 E2E')
    await dialog.getByLabel('商品描述').fill('E2E 測試用描述')
    await dialog.getByLabel('售價').fill('999')
    await dialog.getByLabel('庫存').fill('10')
    // select categoryId (required) — pick 3C電子
    await dialog.getByRole('combobox').first().click()
    await page.getByRole('option', { name: '3C電子' }).click()
    await dialog.getByRole('button', { name: '新增商品' }).click()
    await expect(page.getByText('商品已新增')).toBeVisible({ timeout: 8000 })
  })
})

test.describe('後台 — 編輯商品', () => {
  test('開啟編輯表單', async ({ page }) => {
    await page.getByTestId('edit-btn').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('修改名稱後儲存', async ({ page }) => {
    await page.getByTestId('edit-btn').first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('商品名稱').clear()
    await dialog.getByLabel('商品名稱').fill('已編輯商品')
    await dialog.getByRole('button', { name: /儲存|確認/ }).click()
    await page.waitForTimeout(600)
    await expect(page.getByRole('table').getByText('已編輯商品')).toBeVisible()
  })
})

test.describe('後台 — 刪除商品', () => {
  test('刪除按鈕顯示確認', async ({ page }) => {
    await page.getByTestId('delete-btn').first().click()
    await expect(page.getByRole('alertdialog').or(page.getByRole('dialog'))).toBeVisible()
  })

  test('確認刪除後列數減少', async ({ page }) => {
    const rowsBefore = await page.getByRole('row').count()
    await page.getByTestId('delete-btn').first().click()
    await page.getByRole('button', { name: /確認|確定|刪除/ }).last().click()
    await page.waitForTimeout(600)
    const rowsAfter = await page.getByRole('row').count()
    expect(rowsAfter).toBeLessThan(rowsBefore)
  })
})

test.describe('後台 — 批次操作', () => {
  test('勾選 checkbox 顯示批次工具列', async ({ page }) => {
    await page.getByRole('row').nth(1).getByRole('checkbox').click()
    await expect(page.getByText(/已選/)).toBeVisible()
  })

  test('批次上架', async ({ page }) => {
    await page.getByRole('row').nth(1).getByRole('checkbox').click()
    await expect(page.getByText(/已選/)).toBeVisible()
    await page.getByTestId('batch-activate').click()
    await page.getByRole('button', { name: '確認上架' }).click()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('批次下架', async ({ page }) => {
    await page.getByRole('row').nth(1).getByRole('checkbox').click()
    await expect(page.getByText(/已選/)).toBeVisible()
    await page.getByTestId('batch-deactivate').click()
    await page.getByRole('button', { name: '確認下架' }).click()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('全選 checkbox', async ({ page }) => {
    await page.getByRole('row').nth(0).getByRole('checkbox').click()
    await expect(page.getByText(/已選/)).toBeVisible()
  })
})
