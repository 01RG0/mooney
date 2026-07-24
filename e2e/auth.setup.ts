import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../playwright/.auth/user.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  // Fill login form — find the email and password fields by type or placeholder
  await page.locator('input[type=email], input[name=email], input[placeholder*=email i]').first().fill(process.env.TEST_EMAIL ?? 'test@meromade.com')
  await page.locator('input[type=password], input[name=password]').first().fill(process.env.TEST_PASSWORD ?? 'testpassword123')
  await page.locator('button[type=submit], button:has-text("Log In"), button:has-text("Sign in")').first().click()
  // Wait for redirect away from /login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })
  await page.context().storageState({ path: authFile, indexedDB: true })
})
