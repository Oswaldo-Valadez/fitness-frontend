import { expect, test } from '@playwright/test'

// Sprint 5G: runs under the "user" Playwright project (pre-authenticated
// demo-user storageState from global setup) — no per-test login.

test.describe('smoke: demo user golden path', () => {
  test('dashboard shows the calorie ring and weight trend without crashing', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Peso corporal')).toBeVisible()
  })

  test('library shows the seeded demo recipe and my-food', async ({ page }) => {
    await page.goto('/library/recipes')
    await expect(page.getByText('Arroz con pollo (demo)')).toBeVisible()

    await page.goto('/library/my-foods')
    await expect(page.getByText('Licuado casero de la demo')).toBeVisible()
  })

  test('reports page renders a period selector and summary tiles', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByText('Cobertura')).toBeVisible()
  })
})
