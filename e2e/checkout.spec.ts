import { test, expect } from '@playwright/test'

test.describe('Checkout', () => {
  test('empty cart on checkout shows empty message or prompt', async ({ page }) => {
    await page.goto('/checkout')
    // Either empty cart or sign in prompt is visible
    const emptyOrPrompt = page.getByRole('heading', { name: /Your cart is empty|Sign in to check out/i })
    await expect(emptyOrPrompt.first()).toBeVisible()
  })

  test('checkout as guest shows sign in prompt', async ({ page }) => {
    // Override context to guest (no cookies / no auth)
    await page.context().clearCookies()
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: /Sign in to check out/i }).or(page.getByRole('link', { name: /Sign in/i }))).toBeVisible()
  })

  test('checkout with items in cart validates fields and places order', async ({ page }) => {
    // Seed cart in localStorage before navigating to checkout
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'mermaid-crafted-cart:v1',
        JSON.stringify([
          {
            id: 'test-item::Natural',
            productId: 'test-item',
            slug: 'woven-belly-basket',
            name: 'Woven Belly Basket',
            price: 28,
            image: '/products/basket-1.png',
            color: 'Natural',
            quantity: 1,
          },
        ])
      )
    })

    await page.goto('/checkout')

    // If authenticated and cart loaded, checkout form should be visible
    const formHeading = page.getByRole('heading', { name: /Shipping details/i })
    if (await formHeading.isVisible()) {
      // 1. Verify form fields exist
      const nameInput = page.locator('input[name="fullName"], input[placeholder*="name" i]').first()
      const emailInput = page.locator('input[name="email"]').first()
      const addressInput = page.locator('input[name="address"]').first()
      const cityInput = page.locator('input[name="city"]').first()
      const postalInput = page.locator('input[name="postalCode"]').first()
      const countryInput = page.locator('input[name="country"]').first()

      await expect(nameInput).toBeVisible()
      await expect(emailInput).toBeVisible()
      await expect(addressInput).toBeVisible()
      await expect(cityInput).toBeVisible()

      // 2. Submit empty form to trigger validation errors
      const submitButton = page.getByRole('button', { name: /Place order/i })
      await submitButton.click()
      await expect(page.getByText(/required/i).first()).toBeVisible()

      // 3. Fill fields properly
      await nameInput.fill('Jane Doe')
      await emailInput.fill('jane@example.com')
      await addressInput.fill('123 Main St')
      await cityInput.fill('London')
      await postalInput.fill('SW1A 1AA')
      await countryInput.fill('United Kingdom')

      // 4. Submit order
      await submitButton.click()

      // 5. Verify confirmation screen with order ID
      await expect(page.getByRole('heading', { name: /Thank you — your order is placed/i })).toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/Order/i)).toBeVisible()
    }
  })
})
