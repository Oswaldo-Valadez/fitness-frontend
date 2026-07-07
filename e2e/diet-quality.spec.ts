import { type Page, expect, test } from '@playwright/test'

const DEMO_EMAIL = 'demo@fitness.local'
const DEMO_PASSWORD = 'Password123!'

/**
 * Sprint 3 end-to-end flow against a real, seeded backend (no external
 * services). Requires DatabaseSeeder (DietQualityDemoSeeder) so the demo user
 * has two historical assessments and two active goals (vegetables + fish);
 * the legumes focus stays free for this flow to claim.
 *
 * Serial: later steps depend on the state created by earlier ones.
 */
test.describe.configure({ mode: 'serial' })

async function login(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', DEMO_EMAIL)
  await page.fill('input[type="password"]', DEMO_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard/)
}

/** Sanctum SPA: mutating API calls need the XSRF cookie echoed as a header. */
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

test.describe('diet quality module', () => {
  test('full assessment → goal → check-in → consent flow', async ({ page }) => {
    await login(page)

    // 2–3. Reports → Calidad de dieta tab → historical assessment visible
    await page.goto('/reports')
    await page.getByRole('tab', { name: 'Calidad de dieta' }).click()
    await page.waitForURL(/\/reports\/quality/)
    await expect(page.getByText('Puntaje MEDAS-14').first()).toBeVisible()
    await expect(page.getByText(/respecto a tu evaluación anterior/)).toBeVisible()

    // 4–6. New assessment: answer 14 questions, alcohol notice on wine step
    await page.getByRole('button', { name: 'Nueva evaluación' }).click()
    await page.waitForURL(/\/reports\/quality\/assessment/)

    // Answers chosen so legumes stays unmet → focus candidate for step 12
    const numericAnswers: Record<string, string> = {
      olive_oil_tbsp_day: '2',
      vegetable_servings_day: '2',
      fruit_units_day: '3',
      red_processed_meat_servings_day: '0.5',
      butter_margarine_cream_servings_day: '0',
      sweetened_beverages_day: '0',
      wine_glasses_week: '0',
      legume_servings_week: '1',
      fish_seafood_servings_week: '3',
      commercial_pastries_week: '1',
      nuts_servings_week: '3',
      sofrito_servings_week: '2',
    }

    for (let i = 1; i <= 14; i++) {
      await expect(page.getByText(`Pregunta ${i} de 14`)).toBeVisible()

      const wineStep = await page.getByText('¿Cuántas copas de vino consumes por semana?').isVisible()
      if (wineStep) {
        await expect(page.getByText(/No comiences ni aumentes el consumo de alcohol/)).toBeVisible()
      }

      const numericInput = page.locator('input[inputmode="decimal"]')
      if (await numericInput.isVisible()) {
        // Fill based on the visible question by reading its input id
        const id = await numericInput.getAttribute('id')
        const questionCode = id?.replace('answer-', '') ?? ''
        await numericInput.fill(numericAnswers[questionCode] ?? '1')
      } else {
        await page.getByRole('button', { name: 'Sí', exact: true }).click()
      }

      await page.getByRole('button', { name: i === 14 ? 'Revisar respuestas' : 'Siguiente' }).click()
    }

    // 7–8. Review summary then submit; score visible on the detail page
    await expect(page.getByText('Revisa tus respuestas')).toBeVisible()
    await page.getByRole('button', { name: 'Enviar evaluación' }).click()
    await page.waitForURL(/\/reports\/quality\/assessments\/\d+/)
    await expect(page.getByText(/^\d+\/14$/).first()).toBeVisible()

    // 9–11. Hub: change vs previous, alcohol never a focus candidate
    await page.goto('/reports/quality')
    await expect(page.getByText(/respecto a tu evaluación anterior/)).toBeVisible()
    const candidateItems = page.locator('li').filter({ has: page.getByRole('button', { name: 'Elegir como meta' }) })
    const legumeCandidate = candidateItems.filter({ hasText: 'Porciones de leguminosas por semana' })
    await expect(legumeCandidate).toBeVisible()
    // Alcohol is never offered as a focus candidate; only the safety notice mentions wine
    await expect(candidateItems.filter({ hasText: /vino/i })).toHaveCount(0)
    await expect(page.getByRole('note').filter({ hasText: /vino/i })).toBeVisible()

    // 12. Create the legumes goal explicitly
    await legumeCandidate.getByRole('button', { name: 'Elegir como meta' }).click()
    await page.getByRole('button', { name: 'Confirmar meta' }).click()
    await expect(page.getByText('Meta creada', { exact: false })).toBeVisible()

    // 13. Check-in on the new goal
    await page.waitForTimeout(500) // summary reload
    const legumeGoal = page
      .locator('li', { hasText: 'Porciones de leguminosas por semana' })
      .filter({ has: page.getByRole('button', { name: 'Registrar' }) })
      .first()
    await legumeGoal.getByRole('button', { name: 'Registrar' }).click()
    await page.getByLabel(/Valor/).fill('1')
    await page.getByRole('button', { name: 'Guardar registro' }).click()
    await expect(page.getByText('Registro guardado.')).toBeVisible()

    // 14–15. Pause then reactivate
    await legumeGoal.getByRole('button', { name: 'Pausar' }).click()
    await expect(page.getByText('Metas en pausa')).toBeVisible()
    await page.getByRole('button', { name: 'Reactivar' }).first().click()
    await expect(page.getByText('Metas en pausa')).toHaveCount(0)

    // 16. Dashboard card
    await page.goto('/dashboard')
    await expect(page.getByText('Calidad de dieta').first()).toBeVisible()
    await expect(page.getByText(/Último MEDAS-14/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver calidad de dieta' })).toBeVisible()

    // 17. Account export includes the diet-quality sections
    const exportResponse = await page.request.get('/api/account/export', { headers: await apiHeaders(page) })
    expect(exportResponse.ok()).toBeTruthy()
    const exportJson = await exportResponse.json()
    expect(exportJson.export_version).toBe('3.0.0')
    expect(exportJson.diet_quality_assessments.length).toBeGreaterThan(0)
    expect(exportJson.diet_quality_goals.length).toBeGreaterThan(0)
    expect(exportJson.diet_quality_check_ins.length).toBeGreaterThan(0)

    // 18–20. Revoke a consent → reads still work, mutations return 409
    const consentId = exportJson.consents.find((c: { revoked_at: string | null }) => c.revoked_at === null)?.id
    expect(consentId).toBeTruthy()
    const revokeResponse = await page.request.post(`/api/account/consents/${consentId}/revoke`, {
      headers: await apiHeaders(page),
    })
    expect(revokeResponse.ok()).toBeTruthy()

    const readAfterRevoke = await page.request.get('/api/diet-quality/summary', { headers: await apiHeaders(page) })
    expect(readAfterRevoke.status()).toBe(200)

    const goalId = exportJson.diet_quality_goals[0].id
    // Yesterday (UTC) is never a future local date, so it passes validation
    const today = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10)
    const blockedMutation = await page.request.put(`/api/diet-quality/goals/${goalId}/check-ins/${today}`, {
      headers: await apiHeaders(page),
      data: { value: 1, note: null },
    })
    expect(blockedMutation.status()).toBe(409)
    expect((await blockedMutation.json()).code).toBe('CONSENT_REQUIRED')

    // 21–22. Re-accept consents → mutations available again
    const reaccept = await page.request.post('/api/onboarding/consents', {
      headers: await apiHeaders(page),
      data: { terms: true, privacy: true, general_wellness_disclaimer: true },
    })
    expect(reaccept.ok()).toBeTruthy()

    const restoredMutation = await page.request.put(`/api/diet-quality/goals/${goalId}/check-ins/${today}`, {
      headers: await apiHeaders(page),
      data: { value: 1, note: null },
    })
    expect(restoredMutation.status()).toBe(200)
  })
})
