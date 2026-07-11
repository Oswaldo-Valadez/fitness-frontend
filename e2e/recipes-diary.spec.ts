import { expect, test } from '@playwright/test'
import { DEMO_EMAIL, DEMO_PASSWORD, apiRequest, login } from './helpers'

test.describe('recipes and diary registration', () => {
  test('create a recipe, then register it into the diary by servings', async ({ page }) => {
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto('/recipes/new')

    const recipeName = `Guiso E2E ${Date.now()}`
    await page.fill('#recipe-name', recipeName)
    await page.fill('#recipe-yield', '400')
    await page.fill('#recipe-servings', '4')

    await page.fill('#ingredient-search', 'Arroz blanco')
    await page.getByRole('button', { name: /Arroz blanco cocido/ }).click()
    await page.fill('#ingredient-search', 'Frijoles negros')
    await page.getByRole('button', { name: /Frijoles negros cocidos/ }).click()

    await page.getByRole('button', { name: 'Crear receta' }).click()
    await page.waitForURL(/\/recipes\/\d+$/)
    await expect(page.getByText(recipeName)).toBeVisible()

    await page.getByRole('button', { name: 'Agregar al diario' }).click()
    await page.waitForURL(/\/diary/)
    await expect(page.getByText(recipeName)).toBeVisible()
    await page.getByRole('button', { name: '+ Comida' }).click()
    await expect(page.getByText(/Agregado a comida/i)).toBeVisible()
  })

  test('register a food into the diary by portion (not raw grams)', async ({ page }) => {
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)

    const search = await apiRequest(page, 'GET', '/api/foods?q=Leche entera')
    const { data } = search.json as { data: { id: number }[] }
    const foodId = data[0].id
    const uniqueUnit = `vaso E2E ${Date.now()}`
    const created = await apiRequest(page, 'POST', `/api/foods/${foodId}/portions`, {
      description: '1 vaso E2E',
      amount: 1,
      unit_label: uniqueUnit,
      gram_weight: 240,
    })
    const { portion } = created.json as { portion: { display_label: string } }

    await page.goto('/diary')
    await page.fill('#food-query', 'Leche entera')
    await page
      .getByRole('option', { name: /Leche entera de vaca/ })
      .first()
      .click()
    // The UI shows the backend-computed display_label
    // ("{amount} {unit_label} ({gram_weight} g)"), not the raw description.
    await page.getByRole('button', { name: portion.display_label }).click()
    await page.getByRole('button', { name: '+ Desayuno' }).click()

    await expect(page.getByText(/Agregado a desayuno/i)).toBeVisible()
    await expect(page.getByText('Leche entera de vaca (demo)')).toBeVisible()
  })
})
