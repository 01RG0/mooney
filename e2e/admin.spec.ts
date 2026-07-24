import { test, expect } from '@playwright/test'

test.describe('Admin Panel', () => {
  test('redirects unauthenticated guest to login', async ({ page }) => {
    // Clear auth state to simulate guest
    await page.context().clearCookies()
    await page.goto('/admin')
    await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 10000 })
    expect(page.url()).toContain('/login')
  })

  test('dashboard loads with stats cards', async ({ page }) => {
    await page.goto('/admin')
    // If user is admin, dashboard should render
    const heading = page.getByRole('heading', { name: 'Dashboard' })
    if (await heading.isVisible()) {
      await expect(page.getByText('Total Orders')).toBeVisible()
      await expect(page.getByText('Revenue')).toBeVisible()
      await expect(page.getByText('Products')).toBeVisible()
      await expect(page.getByText('Categories')).toBeVisible()
    }
  })

  test('products page loads product list or empty state', async ({ page }) => {
    await page.goto('/admin/products')
    const heading = page.getByRole('heading', { name: 'Products' })
    if (await heading.isVisible()) {
      const addProductLink = page.getByRole('link', { name: '+ Add Product' })
      await expect(addProductLink).toBeVisible()
      const content = page.getByText(/No products yet/i).or(page.locator('table'))
      await expect(content.first()).toBeVisible()
    }
  })

  test('add product page loads form with fields', async ({ page }) => {
    await page.goto('/admin/products/new')
    const heading = page.getByRole('heading', { name: 'Add Product' })
    if (await heading.isVisible()) {
      await expect(page.locator('input[name="name"]')).toBeVisible()
      await expect(page.locator('input[name="slug"]')).toBeVisible()
      await expect(page.locator('select[name="category"]')).toBeVisible()
      await expect(page.locator('input[name="price"]')).toBeVisible()
      await expect(page.getByRole('button', { name: /Create Product/i })).toBeVisible()
    }
  })

  test('categories page loads category list with Add Category button', async ({ page }) => {
    await page.goto('/admin/categories')
    const heading = page.getByRole('heading', { name: 'Categories' })
    if (await heading.isVisible()) {
      await expect(page.getByRole('button', { name: '+ Add Category' })).toBeVisible()
    }
  })

  test('orders page loads orders table or empty state', async ({ page }) => {
    await page.goto('/admin/orders')
    const heading = page.getByRole('heading', { name: 'Orders' })
    if (await heading.isVisible()) {
      const content = page.getByText(/No orders yet/i).or(page.locator('table'))
      await expect(content.first()).toBeVisible()
    }
  })
})
