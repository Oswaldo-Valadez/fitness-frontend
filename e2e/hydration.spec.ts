import { type Page, expect, test } from '@playwright/test'
import { DEMO_EMAIL, DEMO_PASSWORD, login } from './helpers'

/**
 * Sprint 5 end-to-end flow against a real, seeded backend (no external
 * services, no real FDC call). Runs its own login deliberately — it
 * exercises the undisclosed-profile switch and consent revoke/reaccept,
 * both of which mutate shared session state the same way auth-consent.spec.ts
 * does, so it stays out of the pre-authenticated "user" storageState project
 * (own project, one real login). The admin-side hydration flow lives in
 * admin.spec.ts (pre-authenticated admin storageState, no extra login).
 *
 * Serial: later steps depend on state created by earlier ones.
 */
test.describe.configure({ mode: 'serial' })

async function apiHeaders(page: Page) {
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

test.describe('hydration module — user flow', () => {
  test('quick add, edit, entries, coverage, dashboard, report, undisclosed range, export, consent', async ({ page }) => {
    // 1. Login
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)

    // 2. Diario → Agua
    await page.goto('/diary')
    await page.getByRole('tab', { name: 'Agua' }).click()
    await page.waitForURL(/\/diary\/water/)
    await expect(page.getByRole('heading', { name: 'Hidratación' })).toBeVisible()

    // 3. Quick add 500 ml
    await page.getByRole('button', { name: '500 ml' }).click()
    await expect(page.getByText('500 ml de agua registrados.')).toBeVisible()

    // 4. Editar a 350 ml
    await page.getByRole('button', { name: /editar registro de 500 ml/i }).click()
    const volumeInput = page.getByLabel('Volumen (ml)')
    await volumeInput.fill('350')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Registro de agua actualizado.')).toBeVisible()

    // 5. Agregar otra entrada (custom amount)
    await page.getByRole('button', { name: 'Otro' }).click()
    await page.getByLabel('Volumen (ml)').fill('200')
    await page.getByRole('button', { name: 'Registrar' }).click()
    await expect(page.getByText('200 ml de agua registrados.')).toBeVisible()

    // 6. Confirmar agua simple separada (350 + 200 = 550). With no dietary
    //    water yet, the total also reads 550 — both figures legitimately
    //    match without being fused into one metric (they're still two
    //    separate fields in the DOM, hence .first()).
    await expect(page.getByText('550 ml').first()).toBeVisible()

    // 7. Confirmar agua alimentaria separada (dietary_water_ml shown even when unknown/null → "—")
    await expect(page.getByText('Agua estimada en alimentos')).toBeVisible()

    // 8. Confirmar total parcial (no diary items with water_ml known yet — the
    //    combined status stays partial, never a fabricated complete total).
    await expect(page.getByText(/cobertura parcial|sin cobertura|desconocido/i).first()).toBeVisible()

    // 9. Confirmar que no aparece porcentaje hidratado
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toMatch(/\d+\s*%\s*hidrat/i)
    expect(bodyText).not.toMatch(/faltan \d+\s*ml/i)

    // 10. Dashboard card
    await page.goto('/dashboard')
    await expect(page.getByText('Agua registrada hoy')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Registrar agua' })).toHaveAttribute('href', '/diary/water')

    // 11. Reporte 7 días
    await page.goto('/reports')
    await page.getByRole('tab', { name: 'Hidratación' }).click()
    await page.waitForURL(/\/reports\/hydration/)
    await page.getByRole('button', { name: '7 días' }).click()
    await expect(page.getByText('Resumen del periodo')).toBeVisible()

    // 12. Tabla accesible
    const table = page.getByRole('table', { name: /historial diario de hidratación registrada/i })
    await expect(table).toBeVisible()

    // 13. Cambiar perfil a undisclosed
    await page.goto('/profile')
    await page.getByRole('tab', { name: 'Cuerpo y objetivo' }).click()
    await page.getByRole('button', { name: 'Editar' }).click()
    // Sex is a SegmentedControl (role="radio" options, not plain buttons).
    await page.getByRole('radio', { name: 'Prefiero no indicarlo' }).click()
    // Pre-existing gap in ProfileStep: the birth_date <input type="date">
    // isn't reformatted from the API's ISO datetime, so it renders blank on
    // edit and blocks native "required" validation — re-fill it explicitly
    // (DevelopmentUsersSeeder: demo user birth_date = 1994-06-15).
    await page.fill('#birth_date', '1994-06-15')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Perfil actualizado correctamente.')).toBeVisible()
    // Saving returns to the "Resumen" tab — switch back to "Cuerpo y
    // objetivo" to confirm the persisted value.
    await page.getByRole('tab', { name: 'Cuerpo y objetivo' }).click()
    await expect(page.getByText('No indicado')).toBeVisible()

    // 14. Confirmar rango (2700–3700, never a 3200 midpoint). Scoped to the
    // hydration card itself — a page-wide getByText('3200 ml') can pick up
    // unrelated bundle/devtools text nodes outside the rendered UI.
    await page.goto('/diary/water')
    const hydrationCard = page.locator('main')
    await expect(hydrationCard.getByText(/2,?700.*3,?700/)).toBeVisible()
    await expect(hydrationCard.getByText('3,200 ml')).toHaveCount(0)
    await expect(hydrationCard.getByText('3200 ml')).toHaveCount(0)

    // 15. Exportar cuenta — hydration sections present
    const exportResponse = await page.request.get('/api/account/export', { headers: await apiHeaders(page) })
    expect(exportResponse.ok()).toBeTruthy()
    const exportJson = await exportResponse.json()
    expect(Array.isArray(exportJson.hydration_entries)).toBe(true)
    expect(exportJson.hydration_entries.length).toBeGreaterThan(0)
    expect(exportJson.hydration_summary_methodology).toBeTruthy()

    // 16. Revocar consentimiento
    const consentId = exportJson.consents.find((c: { revoked_at: string | null }) => c.revoked_at === null)?.id
    expect(consentId).toBeTruthy()
    const revokeResponse = await page.request.post(`/api/account/consents/${consentId}/revoke`, {
      headers: await apiHeaders(page),
    })
    expect(revokeResponse.ok()).toBeTruthy()

    // 17. Reads siguen visibles
    const readAfterRevoke = await page.request.get('/api/hydration/daily', { headers: await apiHeaders(page) })
    expect(readAfterRevoke.status()).toBe(200)

    // 18. Mutación devuelve 409
    const blockedCreate = await page.request.post('/api/hydration/entries', {
      headers: await apiHeaders(page),
      data: { volume_ml: 100, occurred_at: new Date().toISOString() },
    })
    expect(blockedCreate.status()).toBe(409)
    expect((await blockedCreate.json()).code).toBe('CONSENT_REQUIRED')

    // 19. Reaceptar consentimiento
    const reaccept = await page.request.post('/api/onboarding/consents', {
      headers: await apiHeaders(page),
      data: { terms: true, privacy: true, general_wellness_disclaimer: true },
    })
    expect(reaccept.ok()).toBeTruthy()

    // Restore profile to its seeded disclosed value (DevelopmentUsersSeeder:
    // demo user = male) so other spec files relying on a concrete
    // sex_for_equation aren't affected by this test's side effect.
    await page.goto('/profile')
    await page.getByRole('tab', { name: 'Cuerpo y objetivo' }).click()
    await page.getByRole('button', { name: 'Editar' }).click()
    await page.getByRole('radio', { name: 'Masculino' }).click()
    await page.fill('#birth_date', '1994-06-15')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText('Perfil actualizado correctamente.')).toBeVisible()
    await page.getByRole('tab', { name: 'Cuerpo y objetivo' }).click()
    await expect(page.getByText('Masculino')).toBeVisible()
  })
})

// The admin-side hydration flow (water_ml food, dynamic micronutrients, FDC
// 255 mapping) lives in admin.spec.ts — it runs under the pre-authenticated
// admin storageState project and doesn't need its own real login.
