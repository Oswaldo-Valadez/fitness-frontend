import { expect, test } from '@playwright/test'
import { DEMO_EMAIL, DEMO_PASSWORD, apiRequest, login } from './helpers'

test.describe('private foods, portions, favorites, recents', () => {
  test('creating a private food with a real zero renders "0", not "Sin dato"', async ({ page }) => {
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)
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
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto('/library/my-foods')

    await page.getByRole('button', { name: 'Nuevo' }).click()
    await page.fill('#my-food-name', `Plato casero sin etiqueta E2E ${Date.now()}`)
    // Every macro left blank: energy is genuinely unknown for this food.
    await page.getByRole('button', { name: 'Crear alimento' }).click()

    await expect(page.getByText('Alimento guardado.')).toBeVisible()
    const row = page.locator('.flex.items-center.gap-3', { hasText: 'Plato casero sin etiqueta E2E' })
    await expect(row.getByText('Sin dato')).toBeVisible()
  })

  test('creating a food portion via the documented endpoint (no dedicated UI exists for this yet)', async ({ page }) => {
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)

    // Fase 10C finding: the frontend has no screen to create a food portion —
    // foodsApi.createPortion() exists but nothing calls it. Not a bug to fix
    // here (out of scope per "no agregues features"); verified at the
    // contract level instead so the flow itself is proven end-to-end.
    const search = await apiRequest(page, 'GET', '/api/foods?q=Arroz blanco cocido')
    const { data } = search.json as { data: { id: number }[] }
    const foodId = data[0].id

    const uniqueUnit = `taza E2E ${Date.now()}`
    const created = await apiRequest(page, 'POST', `/api/foods/${foodId}/portions`, {
      description: '1 taza E2E',
      amount: 1,
      unit_label: uniqueUnit,
      gram_weight: 158,
    })
    expect(created.ok).toBeTruthy()
    const { portion } = created.json as { portion: { gram_weight: number; display_label: string } }
    expect(portion.gram_weight).toBe(158)

    // The UI always shows the backend-computed display_label
    // ("{amount} {unit_label} ({gram_weight} g)"), not the free-text
    // description — using a unique unit label keeps this assertion
    // independent of any other portions on this food.
    await page.goto(`/foods/${foodId}`)
    await expect(page.getByText(portion.display_label)).toBeVisible()
  })

  test('favoriting a food in the catalog persists across navigation', async ({ page }) => {
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)
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
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)
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
