import { expect, test } from '@playwright/test'
import { apiRequest } from './helpers'

test.describe('recipes and diary registration', () => {
  test('create a recipe, then register it into the diary by servings', async ({ page }) => {
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
    // Scoped to the heading: the recipe name also appears in an sr-only
    // nutrient-breakdown table caption (Sprint 4G), which a loose
    // getByText(recipeName) would also match.
    await expect(page.getByRole('heading', { name: recipeName })).toBeVisible()

    await page.getByRole('button', { name: 'Agregar al diario' }).click()
    await page.waitForURL(/\/diary/)
    await expect(page.getByText(recipeName).first()).toBeVisible()
    await page.getByRole('button', { name: '+ Comida' }).click()
    await expect(page.getByText(/Agregado a comida/i)).toBeVisible()
  })

  test('register a food into the diary by portion (not raw grams)', async ({ page }) => {
    // apiRequest() reads document.cookie via page.evaluate — needs a real
    // page loaded first (storageState alone leaves the page on about:blank,
    // where cookie access throws a SecurityError).
    await page.goto('/dashboard')
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

  test('editing a meal name and notes persists after reload (Fase 11D)', async ({ page }) => {
    await page.goto('/diary')
    await page.fill('#food-query', 'Manzana fresca')
    await page
      .getByRole('option', { name: /Manzana fresca/ })
      .first()
      .click()
    await page.getByRole('button', { name: '+ Snack' }).click()
    await expect(page.getByText(/Agregado a snack/i)).toBeVisible()

    const mealName = `Merienda E2E ${Date.now()}`
    await page.getByRole('button', { name: 'Editar comida' }).click()
    await page.fill('#edit-meal-name', mealName)
    await page.fill('#edit-meal-notes', 'Sin azúcar añadida')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Comida actualizada.')).toBeVisible()
    await expect(page.getByText(mealName)).toBeVisible()

    await page.reload()
    await expect(page.getByText(mealName)).toBeVisible()
  })
})
