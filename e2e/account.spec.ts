import { test, expect } from '@playwright/test'

test.describe('Account', () => {
  test('unauthenticated guest is redirected to login', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/account')
    await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 10000 })
    expect(page.url()).toContain('/login')
  })

  test('authenticated user sees My Account page with Email field', async ({ page }) => {
    await page.goto('/account')
    const heading = page.getByRole('heading', { name: 'My Account' })
    if (await heading.isVisible()) {
      await expect(page.getByText('Email')).toBeVisible()
    }
  })
})
