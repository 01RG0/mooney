import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Public Pages', () => {
  test('homepage loads correctly as guest', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(/Meromade/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('shop page loads correctly as guest', async ({ page }) => {
    const response = await page.goto('/shop')
    expect(response?.status()).toBe(200)
    // Check category filter button (e.g. "All")
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible()
    // Either product grid or empty state message is visible
    const productCardOrEmpty = page.getByRole('heading', { name: /arrivals|collection|nothing here/i }).or(page.locator('a[href*="/product/"]').first())
    await expect(productCardOrEmpty.first()).toBeVisible()
  })

  test('login page loads correctly as guest', async ({ page }) => {
    const response = await page.goto('/login')
    expect(response?.status()).toBe(200)
    await expect(page.getByLabel(/email/i).or(page.getByPlaceholder(/you@example.com/i)).first()).toBeVisible()
    await expect(page.getByLabel(/password/i).or(page.getByPlaceholder(/••••••••/i)).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Log In/i }).first()).toBeVisible()
  })

  test('terms of service page loads correctly as guest', async ({ page }) => {
    const response = await page.goto('/terms')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible()
  })

  test('privacy policy page loads correctly as guest', async ({ page }) => {
    const response = await page.goto('/privacy')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
  })

  test('cart page loads without error as guest', async ({ page }) => {
    const response = await page.goto('/cart')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: /cart/i })).toBeVisible()
  })
})
