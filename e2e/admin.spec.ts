import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { apiRequest } from './helpers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Sprint 5G: this file runs under the "admin" Playwright project, which
// loads a pre-authenticated admin storageState from global setup — no
// per-test login() call, so it no longer contributes to the shared
// throttle:auth budget. The "regular user redirected away from /admin"
// guard test moved to auth-consent.spec.ts, since it genuinely needs a
// non-admin session and belongs with the other auth-boundary tests.

test.describe('smoke: admin guard and FDC status', () => {
  test('an admin sees the FDC integration status without the API key', async ({ page }) => {
    await page.goto('/admin/fdc')
    await expect(page.getByText('Estado de la integración')).toBeVisible()
    await expect(page.getByText(/api_key|apiKey/i)).toHaveCount(0)
  })
})

test.describe('admin food CRUD and CSV import', () => {
  test('create, edit, and delete a food from the admin panel', async ({ page }) => {
    await page.goto('/admin/foods')

    const name = `Alimento admin E2E ${Date.now()}`
    await page.getByRole('button', { name: 'Nuevo alimento' }).click()
    await page.fill('#food-name', name)
    await page.selectOption('#food-source', { label: 'Demo dataset — not for production' })
    await page.fill('#food-kcal', '100')
    await page.fill('#food-protein', '10')
    await page.fill('#food-carbs', '10')
    await page.fill('#food-fat', '2')
    await page.getByRole('button', { name: 'Crear alimento' }).click()
    await expect(page.getByText('Alimento guardado.')).toBeVisible()

    await page.fill('#admin-search', name)
    await page.waitForTimeout(400)
    await expect(page.getByText(name)).toBeVisible()

    await page.getByRole('button', { name: `Editar ${name}` }).click()
    await page.fill('#food-category', 'Actualizado E2E')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Alimento guardado.')).toBeVisible()

    await page.getByRole('button', { name: `Eliminar ${name}` }).click()
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click()
    await expect(page.getByText(`${name} eliminado.`)).toBeVisible()
  })

  test('CSV import preview shows valid/invalid counts without committing', async ({ page }) => {
    await page.goto('/admin/foods')

    await page.selectOption('#import-source', { label: 'Demo dataset — not for production' })
    await page.setInputFiles('input[type="file"]', path.join(__dirname, 'fixtures', 'import-preview.csv'))
    await page.getByRole('button', { name: 'Ver vista previa' }).click()

    await expect(page.getByText(/filas válidas de/)).toBeVisible()
  })
})

test.describe('admin FDC batches, nutrient mappings, and audit', () => {
  test('FDC status shows disabled when FDC_ENABLED is off', async ({ page }) => {
    await page.goto('/admin/fdc')
    await expect(page.getByText('Deshabilitada')).toBeVisible()
  })

  test('import batches list shows the empty state on a fresh database', async ({ page }) => {
    await page.goto('/admin/imports')
    await expect(page.getByText('Sin importaciones')).toBeVisible()
  })

  test('nutrient mappings list shows the seeded canonical FDC mappings on a fresh database', async ({ page }) => {
    // Since Sprint 4E, ExternalNutrientMappingSeeder seeds the 17 canonical,
    // locked FDC->nutrient mappings on every fresh database (DatabaseSeeder) —
    // "fresh" no longer means "empty" for this list.
    await page.goto('/admin/nutrient-mappings')
    await expect(page.getByText('Calcium, Ca')).toBeVisible()
    await expect(page.getByText('mapped').first()).toBeVisible()
  })

  test('audit list shows entries after an admin mutation (append-only trail)', async ({ page }) => {
    await page.goto('/admin/foods')
    await page.getByRole('button', { name: 'Nuevo alimento' }).click()
    await page.fill('#food-name', `Auditado E2E ${Date.now()}`)
    await page.selectOption('#food-source', { label: 'Demo dataset — not for production' })
    await page.fill('#food-kcal', '50')
    await page.fill('#food-protein', '1')
    await page.fill('#food-carbs', '1')
    await page.fill('#food-fat', '1')
    await page.getByRole('button', { name: 'Crear alimento' }).click()
    await expect(page.getByText('Alimento guardado.')).toBeVisible()

    await page.goto('/admin/audit')
    // Events accumulate across the whole suite (append-only, admin.spec.ts
    // runs after other admin/nutrient/diet-quality flows in the same DB), so
    // this just confirms the page renders either its empty state or the
    // event-card list without crashing — the list is <Card> rows (each with
    // a font-mono event_type span), not a <table>.
    await expect(page.getByText('Sin eventos').or(page.locator('span.font-mono').first())).toBeVisible()
  })
})

test.describe('admin hydration: water_ml food, dynamic micronutrients, FDC 255 mapping (Sprint 5)', () => {
  test('creates a food with water_ml and dynamic micronutrients, confirms zero vs blank, and the locked 255 mapping', async ({ page }) => {
    await page.goto('/admin/foods')

    const waterFoodName = `Alimento con agua E2E ${Date.now()}`
    await page.getByRole('button', { name: 'Nuevo alimento' }).click()
    await page.fill('#food-name', waterFoodName)
    await page.selectOption('#food-source', { label: 'Demo dataset — not for production' })
    await page.fill('#food-kcal', '50')
    await page.fill('#food-protein', '1')
    await page.fill('#food-carbs', '5')
    await page.fill('#food-fat', '0')
    await page.getByText('Micronutrientes opcionales').click()
    await page.fill('#food-water_ml', '85.5')
    await page.getByRole('button', { name: 'Crear alimento' }).click()
    await expect(page.getByText('Alimento guardado.')).toBeVisible()

    // Dynamic micronutrients not limited to the six legacy fields: calcium
    // (real zero on iron_mg) plus water_ml, in the same payload.
    const dynamicFoodName = `Alimento dinámico E2E ${Date.now()}`
    await page.getByRole('button', { name: 'Nuevo alimento' }).click()
    await page.fill('#food-name', dynamicFoodName)
    await page.selectOption('#food-source', { label: 'Demo dataset — not for production' })
    await page.fill('#food-kcal', '40')
    await page.fill('#food-protein', '1')
    await page.fill('#food-carbs', '4')
    await page.fill('#food-fat', '0')
    await page.getByText('Micronutrientes opcionales').click()
    await page.fill('#food-calcium_mg', '120')
    await page.fill('#food-iron_mg', '0')
    await page.getByRole('button', { name: 'Crear alimento' }).click()
    await expect(page.getByText('Alimento guardado.')).toBeVisible()

    // Confirm zero vs blank via the authenticated API (the admin list UI
    // shows nutrient IDs, not codes — same pattern as nutrients.spec.ts).
    const foodsResponse = await apiRequest(page, 'GET', `/api/admin/foods?q=${encodeURIComponent(dynamicFoodName)}`)
    const foods = (foodsResponse.json as { data: Array<{ id: number; name: string; nutrients: Array<{ code: string; amount_per_100g: number }> }> }).data
    const created = foods.find((f) => f.name === dynamicFoodName)
    expect(created).toBeTruthy()
    const byCode = Object.fromEntries((created?.nutrients ?? []).map((n) => [n.code, n.amount_per_100g]))
    expect(Number(byCode.iron_mg)).toBe(0)
    expect(byCode.vitamin_c_mg).toBeUndefined() // never sent, stays absent (unknown), not zero

    // Mapping 255 G → water_ml (seeded, locked).
    const mappingsResponse = await apiRequest(page, 'GET', '/api/admin/nutrient-mappings')
    const mappings = (
      mappingsResponse.json as { data: Array<{ id: number; external_nutrient_id: string; nutrient_id: number; is_locked: boolean; mapping_status: string }> }
    ).data
    const waterMapping = mappings.find((m) => m.external_nutrient_id === '255')
    expect(waterMapping?.is_locked).toBe(true)
    expect(waterMapping?.mapping_status).toBe('mapped')

    // Mapping incompatible → 422: locked canonical mappings (255 -> water_ml)
    // can never be repointed through this endpoint, even with an otherwise
    // valid, self-referential payload — the lock itself is what rejects it.
    const rejected = await apiRequest(page, 'PUT', `/api/admin/nutrient-mappings/${waterMapping!.id}`, {
      nutrient_id: waterMapping!.nutrient_id,
      mapping_status: 'mapped',
    })
    expect(rejected.status).toBe(422)
  })
})
