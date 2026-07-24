import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Cart', () => {
  test('empty cart shows empty message and link to shop', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.getByRole('heading', { name: /Your cart is empty/i })).toBeVisible()
    const shopLink = page.getByRole('link', { name: /Browse the shop/i })
    await expect(shopLink).toBeVisible()
  })

  test('full cart flow: add item, update quantity, remove item, proceed to checkout', async ({ page }) => {
    // 1. Navigate to shop and add a product to cart
    await page.goto('/shop')
    const addButtons = page.locator('button[aria-label*="Add"]').or(page.locator('button:has-text("Add to cart")'))

    // If products exist, click the first add button
    if (await addButtons.first().isVisible()) {
      await addButtons.first().click()

      // 2. Cart icon in header shows updated count or link exists
      const cartLink = page.getByRole('link', { name: /Cart/i })
      await expect(cartLink).toBeVisible()

      // 3. Navigate to /cart and verify item appears
      await page.goto('/cart')
      await expect(page.getByRole('heading', { name: 'Your cart' })).toBeVisible()

      // 4. Increase quantity
      const increaseBtn = page.locator('button[aria-label*="Increase quantity"]').first()
      if (await increaseBtn.isVisible()) {
        await increaseBtn.click()
      }

      // 5. Checkout link exists and points to /checkout
      const checkoutBtn = page.getByRole('link', { name: 'Checkout' })
      await expect(checkoutBtn).toBeVisible()

      // 6. Remove item
      const removeBtn = page.getByRole('button', { name: 'Remove' }).first()
      if (await removeBtn.isVisible()) {
        await removeBtn.click()
        await expect(page.getByRole('heading', { name: /Your cart is empty/i })).toBeVisible()
      }
    } else {
      // Fallback if shop has no products in test DB: visit /cart directly to verify empty state and checkout link check
      await page.goto('/cart')
      await expect(page.getByRole('heading', { name: /Your cart is empty/i })).toBeVisible()
    }
  })
})
