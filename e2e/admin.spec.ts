import { expect, test } from '@playwright/test'

const ADMIN_EMAIL = 'admin@fitness.local'
const ADMIN_PASSWORD = 'Password123!'
const DEMO_EMAIL = 'demo@fitness.local'
const DEMO_PASSWORD = 'Password123!'

test.describe('smoke: admin guard and FDC status', () => {
  test('a regular user is redirected away from /admin/foods', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', DEMO_EMAIL)
    await page.fill('input[type="password"]', DEMO_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    await page.goto('/admin/foods')
    await page.waitForURL(/\/dashboard/)
  })

  test('an admin sees the FDC integration status without the API key', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    await page.goto('/admin/fdc')
    await expect(page.getByText('Estado de la integración')).toBeVisible()
    await expect(page.getByText(/api_key|apiKey/i)).toHaveCount(0)
  })
})
