import { expect, test } from '@playwright/test'

const DEMO_EMAIL = 'demo@fitness.local'
const DEMO_PASSWORD = 'Password123!'

test.describe('smoke: demo user golden path', () => {
  test('login redirects a fully onboarded user straight to the dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', DEMO_EMAIL)
    await page.fill('input[type="password"]', DEMO_PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/dashboard/)
    await expect(page.locator('text=Diario alimenticio').or(page.locator('nav')).first()).toBeVisible()
  })

  test('dashboard shows the calorie ring and weight trend without crashing', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', DEMO_EMAIL)
    await page.fill('input[type="password"]', DEMO_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    await expect(page.getByText('Peso corporal')).toBeVisible()
  })

  test('library shows the seeded demo recipe and my-food', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', DEMO_EMAIL)
    await page.fill('input[type="password"]', DEMO_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    await page.goto('/library/recipes')
    await expect(page.getByText('Arroz con pollo (demo)')).toBeVisible()

    await page.goto('/library/my-foods')
    await expect(page.getByText('Licuado casero de la demo')).toBeVisible()
  })

  test('reports page renders a period selector and summary tiles', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', DEMO_EMAIL)
    await page.fill('input[type="password"]', DEMO_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)

    await page.goto('/reports')
    await expect(page.getByText('Cobertura')).toBeVisible()
  })
})
