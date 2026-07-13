import { expect, test } from '@playwright/test'
import { apiRequest } from './helpers'

test.describe('private foods, portions, favorites, recents', () => {
  test('creating a private food with a real zero renders "0", not "Sin dato"', async ({ page }) => {
    await page.goto('/library/my-foods')

    await page.getByRole('button', { name: 'Nuevo' }).click()
    await page.fill('#my-food-name', `Refresco light E2E ${Date.now()}`)
    await page.fill('#my-food-kcal', '0')
    // protein/carbs/fat/fiber/sodium left blank on purpose: unknown, not zero.
    await page.getByRole('button', { name: 'Crear alimento' }).click()

    await expect(page.getByText('Alimento guardado.')).toBeVisible()
    const row = page.locator('.flex.items-center.gap-3', { hasText: 'Refresco light E2E' })
    await expect(row.getByText('0 kcal/100g')).toBeVisible()
  })

  test('creating a private food with an unknown nutrient renders "Sin dato", never 0', async ({ page }) => {
    await page.goto('/library/my-foods')

    await page.getByRole('button', { name: 'Nuevo' }).click()
    await page.fill('#my-food-name', `Plato casero sin etiqueta E2E ${Date.now()}`)
    // Every macro left blank: energy is genuinely unknown for this food.
    await page.getByRole('button', { name: 'Crear alimento' }).click()

    await expect(page.getByText('Alimento guardado.')).toBeVisible()
    const row = page.locator('.flex.items-center.gap-3', { hasText: 'Plato casero sin etiqueta E2E' })
    await expect(row.getByText('Sin dato')).toBeVisible()
  })

  test('creating, editing, and deleting a food portion from the food detail page (Fase 11A)', async ({ page }) => {
    // apiRequest() reads document.cookie via page.evaluate — needs a real
    // page loaded first (storageState alone leaves the page on about:blank,
    // where cookie access throws a SecurityError).
    await page.goto('/dashboard')
    const search = await apiRequest(page, 'GET', '/api/foods?q=Arroz blanco cocido')
    const { data } = search.json as { data: { id: number }[] }
    const foodId = data[0].id

    const description = `Taza E2E ${Date.now()}`
    const uniqueUnit = `taza-e2e-${Date.now()}`
    await page.goto(`/foods/${foodId}`)
    await page.getByRole('button', { name: 'Agregar porción' }).click()
    await page.fill('#portion-description', description)
    await page.fill('#portion-amount', '1')
    await page.fill('#portion-unit-label', uniqueUnit)
    await page.fill('#portion-gram-weight', '158')
    await page.getByRole('button', { name: 'Crear porción' }).click()

    // The row's visible text is the backend-computed display_label
    // ("{amount} {unit_label} ({gram_weight} g)"), not the free-text
    // description. The same label also appears in the top pill-selector,
    // so scope to the "Mis porciones" row via the unique edit button.
    await expect(page.getByText('Porción guardada.')).toBeVisible()
    const editButton = page.getByRole('button', { name: `Editar porción ${description}` })
    const row = page.locator('div.flex.items-center.justify-between', { has: editButton })
    await expect(row.getByText(`1 ${uniqueUnit} (158 g)`)).toBeVisible()

    await editButton.click()
    await page.fill('#portion-gram-weight', '160')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Porción guardada.')).toBeVisible()
    await expect(row.getByText(`1 ${uniqueUnit} (160 g)`)).toBeVisible()

    await page.getByRole('button', { name: `Eliminar porción ${description}` }).click()
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click()
    await expect(page.getByText('Porción eliminada.')).toBeVisible()
    await expect(page.getByText(uniqueUnit)).toHaveCount(0)
  })

  test('favoriting a food in the catalog persists across navigation', async ({ page }) => {
    await page.goto('/library/foods')
    await page.fill('#food-search', 'Pechuga')
    await page.waitForTimeout(400)

    const favoriteButton = page.getByRole('button', { name: 'Marcar como favorito' }).first()
    await favoriteButton.click()
    await expect(page.getByText('Agregado a favoritos.')).toBeVisible()

    // Favorite state is server-persisted, not local UI state — reload and
    // re-search to confirm it survived, and that the star fill (not just
    // the toast) reflects the real is_favorite value from the backend.
    await page.reload()
    await page.fill('#food-search', 'Pechuga')
    await page.waitForTimeout(400)
    await expect(page.getByRole('button', { name: 'Marcar como favorito' }).first().locator('svg.fill-current')).toBeVisible()
  })

  test('a recently logged food appears as a quick pick', async ({ page }) => {
    await page.goto('/diary')

    await page.fill('#food-query', 'Manzana fresca')
    await page
      .getByRole('option', { name: /Manzana fresca/ })
      .first()
      .click()
    await page.getByRole('button', { name: '+ Snack' }).click()
    await expect(page.getByText(/Agregado a snack/i)).toBeVisible()

    await page.reload()
    await expect(page.getByText('Manzana fresca con cáscara (demo)').first()).toBeVisible()
  })
})
