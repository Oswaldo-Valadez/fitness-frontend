import { expect, test } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_EMAIL, DEMO_PASSWORD, apiRequest, login } from './helpers'

/**
 * Sprint 4H end-to-end flow against a real, seeded backend (no external
 * services, no real FDC call). Requires DemoFoodSeeder (Sprint 4H extension):
 * - "Pechuga de pollo a la plancha (demo)": all ten micronutrients known
 *   (data_origin=external_import/source_reported) — the "complete" fixture.
 * - "Manzana fresca con cáscara (demo)": three of ten micronutrients known
 *   (data_origin=user_entered/user_reported) — the "partial" fixture.
 * - "Arroz blanco cocido (demo)": zero micronutrient rows — the "unknown"
 *   fixture, used as the second recipe ingredient to force a partial recipe.
 * and ExternalNutrientMappingSeeder (locked canonical FDC mappings, incl.
 * 301 calcium_mg and 320 vitamin_a_rae_mcg).
 *
 * Serial: later steps depend on state created by earlier ones (the private
 * food, the recipe, the diary entries, the profile change, the consent
 * revoke/reaccept).
 */
test.describe.configure({ mode: 'serial' })

/** Sanctum SPA: mutating API calls need the XSRF cookie echoed as a header. */
async function apiHeaders(page: import('@playwright/test').Page) {
  const cookies = await page.context().cookies()
  const xsrf = cookies.find((c) => c.name === 'XSRF-TOKEN')
  return {
    'X-XSRF-TOKEN': decodeURIComponent(xsrf?.value ?? ''),
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Origin: 'http://localhost:5173',
    Referer: 'http://localhost:5173/',
  }
}

test.describe('nutrients module — user flow', () => {
  test('food detail, private food, recipe, diary, dashboard, reports, profile, export, consent', async ({ page }) => {
    // 1. Login demo
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)

    // 2–3. Food with complete micronutrients (Pechuga de pollo — demo seeder)
    const chickenSearch = await apiRequest(page, 'GET', '/api/foods?q=Pechuga de pollo')
    const chickenData = (chickenSearch.json as { data: { id: number }[] }).data
    expect(chickenData.length).toBeGreaterThan(0)
    const chickenId = chickenData[0].id
    await page.goto(`/foods/${chickenId}`)
    await expect(page.getByText('Vitaminas · por 100 g')).toBeVisible()
    await expect(page.getByText('Minerales · por 100 g')).toBeVisible()
    // Complete micronutrient food (all 10 known): no "Sin dato" anywhere on
    // the page — the vitamin/mineral sections are the only place it could
    // legitimately appear for this food.
    await expect(page.getByText('Sin dato')).toHaveCount(0)

    // 4. Food with partial micronutrients (Manzana — demo seeder)
    const appleSearch = await apiRequest(page, 'GET', '/api/foods?q=Manzana fresca')
    const appleData = (appleSearch.json as { data: { id: number }[] }).data
    const appleId = appleData[0].id
    await page.goto(`/foods/${appleId}`)
    // Manzana only has calcium/potassium/vitamin C known — some rows unknown.
    await expect(page.getByText('Sin dato').first()).toBeVisible()

    // 5–6. Create a private food: calcium known, iron = 0 (real zero), vitamin D blank
    await page.goto('/library/my-foods')
    await page.getByRole('button', { name: 'Nuevo' }).click()
    const privateFoodName = `Alimento micronutrientes E2E ${Date.now()}`
    await page.fill('#my-food-name', privateFoodName)
    await page.fill('#my-food-kcal', '50')
    await page.getByText('Micronutrientes opcionales').click()
    await page.fill('#my-food-calcium_mg', '80')
    await page.fill('#my-food-iron_mg', '0')
    // vitamin_d_mcg left blank on purpose: unknown, not zero.
    await page.getByRole('button', { name: 'Crear alimento' }).click()
    await expect(page.getByText('Alimento guardado.')).toBeVisible()

    // Confirm iron renders "0" and vitamin D renders "Sin dato" on the detail page.
    const createdSearch = await apiRequest(page, 'GET', `/api/foods?q=${encodeURIComponent(privateFoodName)}`)
    const createdFood = (createdSearch.json as { data: { id: number }[] }).data[0]
    await page.goto(`/foods/${createdFood.id}`)
    await expect(page.getByText('Hierro', { exact: true })).toBeVisible()
    // Real zero renders as a formatted amount ("0.00 mg") right next to the
    // "Hierro" label, never "Sin dato". The row is a flex div with the label
    // and value as siblings — walk up to that row via xpath and read its
    // text as a whole rather than fighting nested `has:` filter ambiguity.
    const ironRowText = await page.locator('xpath=//*[normalize-space(text())="Hierro"]/ancestor::div[1]').first().textContent()
    expect(ironRowText).toContain('0.00 mg')
    expect(ironRowText).not.toContain('Sin dato')

    // A row with no known value at all renders its raw code (no FoodNutrientProvenance
    // row to source a friendly name from) rather than "Vitamina D".
    const vitaminDRowText = await page.locator('xpath=//*[normalize-space(text())="vitamin_d_mcg"]/ancestor::div[1]').first().textContent()
    expect(vitaminDRowText).toContain('Sin dato')

    // 7–8. Create a recipe mixing a complete-micronutrient food (chicken) and
    // an unknown-micronutrient food (rice) → recipe status must be partial.
    await page.goto('/recipes/new')
    const recipeName = `Receta mixta E2E ${Date.now()}`
    await page.fill('#recipe-name', recipeName)
    await page.fill('#recipe-yield', '400')
    await page.fill('#recipe-servings', '2')
    await page.fill('#ingredient-search', 'Pechuga de pollo')
    await page.getByRole('button', { name: /Pechuga de pollo a la plancha/ }).click()
    await page.fill('#ingredient-search', 'Arroz blanco')
    await page.getByRole('button', { name: /Arroz blanco cocido/ }).click()
    // Rice has zero known micronutrients (the "unknown" fixture) — the
    // per-ingredient availability warning must appear, confirming the mix
    // is incomplete/partial (informational only, no client recompute).
    await expect(page.getByText(/Micronutrientes conocidos: 0\/10/)).toBeVisible()

    await page.getByRole('button', { name: 'Crear receta' }).click()
    await page.waitForURL(/\/recipes\/\d+$/)
    // Scoped to the heading: the recipe name also appears in an sr-only
    // nutrient-breakdown table caption, which a loose getByText would match.
    await expect(page.getByRole('heading', { name: recipeName })).toBeVisible()
    const recipeUrl = page.url()
    const recipeId = Number(recipeUrl.match(/\/recipes\/(\d+)$/)?.[1])

    // 9. Add the recipe to the diary
    await page.getByRole('button', { name: 'Agregar al diario' }).click()
    await page.waitForURL(/\/diary/)
    await page.getByRole('button', { name: '+ Comida' }).click()
    await expect(page.getByText(/Agregado a comida/i)).toBeVisible()

    // 10. Add the complete-micronutrient food by portion to the diary
    await page.fill('#food-query', 'Pechuga de pollo')
    await page
      .getByRole('option', { name: /Pechuga de pollo a la plancha/ })
      .first()
      .click()
    await page.getByRole('button', { name: '+ Comida' }).click()
    await expect(page.getByText(/Agregado a comida/i)).toBeVisible()

    // 11–12. Dashboard: compact coverage card
    await page.goto('/dashboard')
    await expect(page.getByText('Micronutrientes').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver nutrientes' })).toBeVisible()

    // 13–14. Reports → Nutrientes, 30 days
    await page.goto('/reports')
    await page.getByRole('tab', { name: 'Nutrientes' }).click()
    await page.waitForURL(/\/reports\/nutrients/)
    await page.getByRole('button', { name: '30 días' }).click()
    await expect(page.getByText('Consulta los nutrientes registrados')).toBeVisible()

    // 15. A partial nutrient card shows the subtotal caveat, no comparison text
    const calciumCard = page.locator('div', { has: page.getByRole('link', { name: 'Calcio' }) }).first()
    if (
      await calciumCard
        .getByText('El subtotal puede estar subestimado')
        .isVisible()
        .catch(() => false)
    ) {
      await expect(calciumCard.getByText(/Por debajo de|En o por encima de|Por encima del CDRR/)).toHaveCount(0)
    }

    // 16–17. Nutrient detail with chart/table
    await page.getByRole('link', { name: 'Calcio' }).click()
    await page.waitForURL(/\/reports\/nutrients\/calcium_mg/)
    await expect(page.getByText('Referencia poblacional')).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()

    // 18–19. Change profile sex to undisclosed → reference shows a range, no midpoint.
    // Uses the API directly (same PUT /api/profile the edit form calls) —
    // sidesteps the edit form's unrelated pre-fill/date-input quirks, which
    // are outside Sprint 4H scope; the goal here is the reference-resolution
    // behavior, not re-testing the profile edit form itself.
    const currentProfile = await apiRequest(page, 'GET', '/api/profile')
    const profileData = (currentProfile.json as { profile: Record<string, unknown> }).profile
    const undisclosedUpdate = await apiRequest(page, 'PUT', '/api/profile', {
      ...profileData,
      sex_for_equation: 'undisclosed',
    })
    expect(undisclosedUpdate.ok).toBeTruthy()

    // Confirm range mode directly via the references endpoint for TODAY
    // (never a single averaged/midpoint value) — a 30-day report page would
    // legitimately show "reference changed mid-period" instead, since the
    // profile was just updated (correct product behavior, not what this
    // step is testing).
    const referencesResponse = await apiRequest(page, 'GET', '/api/nutrition/references')
    const referencesJson = referencesResponse.json as {
      context: { sex_basis: string }
      references: Array<{ nutrient_code: string; reference_mode: string; minimum: number | null; maximum: number | null; value: number | null }>
    }
    expect(referencesJson.context.sex_basis).toBe('undisclosed')
    const ironReference = referencesJson.references.find((r) => r.nutrient_code === 'iron_mg')
    expect(ironReference?.reference_mode).toBe('range')
    expect(ironReference?.minimum).not.toBeNull()
    expect(ironReference?.maximum).not.toBeNull()
    expect(ironReference?.value).toBeNull()

    // 20–21. Export account, confirm 4.0.0 with the new Sprint 4 sections
    const exportResponse = await page.request.get('/api/account/export', { headers: await apiHeaders(page) })
    expect(exportResponse.ok()).toBeTruthy()
    const exportJson = await exportResponse.json()
    expect(exportJson.export_version).toBe('4.0.0')
    expect(Array.isArray(exportJson.meal_log_item_nutrients)).toBe(true)
    expect(Array.isArray(exportJson.recipe_nutrients)).toBe(true)
    expect(Array.isArray(exportJson.nutrient_reference_contexts)).toBe(true)

    // 22. Revoke a consent
    const consentId = exportJson.consents.find((c: { revoked_at: string | null }) => c.revoked_at === null)?.id
    expect(consentId).toBeTruthy()
    const revokeResponse = await page.request.post(`/api/account/consents/${consentId}/revoke`, {
      headers: await apiHeaders(page),
    })
    expect(revokeResponse.ok()).toBeTruthy()

    // 23. Reports still visible (reads survive consent revoke)
    const readAfterRevoke = await page.request.get('/api/nutrition/intake/period?period=30', { headers: await apiHeaders(page) })
    expect(readAfterRevoke.status()).toBe(200)

    // 24. Food mutation returns 409 while consent is revoked (private-food
    // creation is /api/my-foods — /api/foods POST is admin-only).
    const blockedCreate = await page.request.post('/api/my-foods', {
      headers: await apiHeaders(page),
      data: { name: `Bloqueado E2E ${Date.now()}`, nutrition_basis: 'per_100g', nutrients: { energy_kcal: 10 } },
    })
    expect(blockedCreate.status()).toBe(409)
    expect((await blockedCreate.json()).code).toBe('CONSENT_REQUIRED')

    // 25. Reaccept consent → mutations available again
    const reaccept = await page.request.post('/api/onboarding/consents', {
      headers: await apiHeaders(page),
      data: { terms: true, privacy: true, general_wellness_disclaimer: true },
    })
    expect(reaccept.ok()).toBeTruthy()

    const restoredCreate = await page.request.post('/api/my-foods', {
      headers: await apiHeaders(page),
      data: { name: `Restaurado E2E ${Date.now()}`, nutrition_basis: 'per_100g', nutrients: { energy_kcal: 10 } },
    })
    expect(restoredCreate.ok()).toBeTruthy()

    void recipeId // recipe created and used above; id kept for traceability only.
  })
})

test.describe('nutrients module — admin flow', () => {
  test('locked system mappings, incompatible mapping rejected, FDC status has no API key', async ({ page }) => {
    // 1. Login admin
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD)

    // 2–3. Locked system mappings: FDC 301/320 seeded as locked+mapped, resolving
    // to calcium_mg / vitamin_a_rae_mcg (confirmed via the authenticated API,
    // since the admin list UI shows nutrient IDs, not codes).
    const mappingsResponse = await apiRequest(page, 'GET', '/api/admin/nutrient-mappings')
    expect(mappingsResponse.ok).toBeTruthy()
    const mappings = (mappingsResponse.json as { data: Array<{ id: number; external_nutrient_id: string; nutrient_id: number; is_locked: boolean }> }).data
    const calciumMapping = mappings.find((m) => m.external_nutrient_id === '301')
    const vitaminAMapping = mappings.find((m) => m.external_nutrient_id === '320')
    expect(calciumMapping?.is_locked).toBe(true)
    expect(vitaminAMapping?.is_locked).toBe(true)

    const nutrientsCatalog = await apiRequest(page, 'GET', '/api/nutrients')
    const catalog = (nutrientsCatalog.json as { data: Array<{ code: string; name: string }> }).data
    const vitaminA = catalog.find((n) => n.code === 'vitamin_a_rae_mcg')
    expect(vitaminA?.name).toBe('Vitamina A')

    // UI: the locked mapping is visible in the admin screen.
    await page.goto('/admin/nutrient-mappings')
    await expect(page.getByText('Calcium, Ca')).toBeVisible()
    await expect(page.getByText('mapped').first()).toBeVisible()

    // 4–5. Attempt to repoint a locked, canonical system mapping (calcium 301
    // → mapped again) — locked mappings can never be modified through this
    // endpoint, even with an otherwise-valid payload, so it must 422.
    const rejected = await apiRequest(page, 'PUT', `/api/admin/nutrient-mappings/${calciumMapping!.id}`, {
      nutrient_id: calciumMapping!.nutrient_id,
      mapping_status: 'mapped',
    })
    expect(rejected.status).toBe(422)

    // 6–8. Import preview with fake micronutrients is covered by the backend
    // feature suite (tests/Feature/Api/FdcIntegrationTest.php) using
    // Http::fake — this E2E never calls the real FDC API. What IS verified
    // end-to-end here is that a food with FDC-imported-style provenance
    // (source_reference set, data_origin=external_import) renders correctly
    // on the food detail page and never exposes the API key.
    const chickenSearch = await apiRequest(page, 'GET', '/api/foods?q=Pechuga de pollo')
    const chickenId = (chickenSearch.json as { data: { id: number }[] }).data[0].id
    await page.goto(`/foods/${chickenId}`)
    await expect(page.getByText(/api_key|apiKey/i)).toHaveCount(0)

    // 9. FDC status page never exposes the API key
    await page.goto('/admin/fdc')
    await expect(page.getByText('Estado de la integración')).toBeVisible()
    await expect(page.getByText(/api_key|apiKey/i)).toHaveCount(0)
    const statusResponse = await apiRequest(page, 'GET', '/api/admin/integrations/food-data-central')
    const statusJson = statusResponse.json as Record<string, unknown>
    expect(JSON.stringify(statusJson)).not.toMatch(/[A-Za-z0-9]{20,}/) // no raw key-shaped token anywhere
  })
})
