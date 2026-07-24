import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Shop Page', () => {
  test('page title is correct', async ({ page }) => {
    await page.goto('/shop')
    await expect(page).toHaveTitle(/Shop — Meromade|Meromade/i)
  })

  test('category filter chips are visible and clickable', async ({ page }) => {
    await page.goto('/shop')
    const allChip = page.getByRole('button', { name: 'All' })
    await expect(allChip).toBeVisible()
    await expect(allChip).toHaveAttribute('aria-pressed', 'true')

    // Find another filter button if present and click it
    const otherChip = page.getByRole('button', { name: /baskets|florals|stone art|home decor/i }).first()
    if (await otherChip.isVisible()) {
      await otherChip.click()
      await expect(otherChip).toHaveAttribute('aria-pressed', 'true')
    }
  })

  test('shows product cards or empty state, and product card navigates to product details', async ({ page }) => {
    await page.goto('/shop')

    const productLinks = page.locator('a[href^="/product/"]')
    const productCount = await productLinks.count()

    if (productCount > 0) {
      const firstProduct = productLinks.first()
      await expect(firstProduct).toBeVisible()
      await firstProduct.click()
      await page.waitForURL(/\/product\/.+/)
      expect(page.url()).toContain('/product/')
    } else {
      await expect(page.getByText('Nothing here yet')).toBeVisible()
    }
  })
})
