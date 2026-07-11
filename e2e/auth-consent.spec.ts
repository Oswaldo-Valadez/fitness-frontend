import { expect, test } from '@playwright/test'
import { DEMO_EMAIL, DEMO_PASSWORD, apiRequest, login } from './helpers'

test.describe('auth + consent revoke/reaccept', () => {
  test('login lands on dashboard', async ({ page }) => {
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)
    await expect(page.locator('nav').first()).toBeVisible()
  })

  test('a revoked consent blocks the next mutation with 409, and reaccepting through /onboarding clears it', async ({ page }) => {
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)

    // Individual per-consent revocation (by numeric ID) has no dedicated UI —
    // only the bulk "revoke all" action on /account does (see the next test).
    // Arrange this single-consent-revoked state directly through the
    // authenticated session to test the 409-then-reaccept path in isolation.
    const revokeResponse = await apiRequest(page, 'POST', '/api/account/consents/1/revoke')
    expect(revokeResponse.ok).toBeTruthy()

    // Any mutation now gets rejected with 409 CONSENT_REQUIRED.
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Registrar' }).click()
    await page.fill('#weight-input', '70')
    await page.getByRole('button', { name: 'Guardar' }).click()

    await expect(page.getByText(/consentimientos/i).first()).toBeVisible()
    await page.getByRole('link', { name: 'Revisar consentimientos' }).click()

    await page.waitForURL(/\/onboarding/)
    await expect(page.getByText('Consentimientos requeridos')).toBeVisible()
    // Reaccept mode: has_profile is already true, so only the consents step shows.
    await expect(page.getByText('Tu perfil')).toHaveCount(0)

    await page.getByText('Términos y condiciones', { exact: true }).click()
    await page.getByText('Política de privacidad', { exact: true }).click()
    await page.getByText('Aviso de bienestar general', { exact: true }).click()
    await page.getByRole('button', { name: 'Continuar' }).click()

    await page.waitForURL(/\/dashboard|\/profile/)
    await expect(page.getByText(/consentimientos/i)).toHaveCount(0)
  })

  test('revoking all consents from the account page shows the reaccept banner (Fase 11B)', async ({ page }) => {
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto('/account')

    try {
      await page.getByRole('button', { name: 'Revocar mis consentimientos' }).click()
      await page.getByRole('button', { name: 'Sí, revocar' }).click()
      await expect(page.getByText('Consentimientos revocados.')).toBeVisible()
      await expect(page.getByText(/consentimientos/i).first()).toBeVisible()

      // The next mutation is still rejected server-side, confirming the
      // banner reflects a real backend state, not just local UI state.
      await page.goto('/profile')
      await page.getByRole('button', { name: 'Registrar' }).click()
      await page.fill('#weight-input', '71')
      await page.getByRole('button', { name: 'Guardar' }).click()
      await expect(page.getByText(/consentimientos/i).first()).toBeVisible()
    } finally {
      // Revoking is a real, session-wide side effect on the shared demo
      // account — every other spec file needs it able to mutate data, so
      // always reaccept through the same reaccept-onboarding flow the
      // previous test exercises, regardless of whether this test passed.
      await page.getByRole('link', { name: 'Revisar consentimientos' }).click()
      await page.waitForURL(/\/onboarding/)
      await page.getByText('Términos y condiciones', { exact: true }).click()
      await page.getByText('Política de privacidad', { exact: true }).click()
      await page.getByText('Aviso de bienestar general', { exact: true }).click()
      await page.getByRole('button', { name: 'Continuar' }).click()
      await page.waitForURL(/\/dashboard|\/profile/)
    }
  })

  test('changing the password from the account page takes effect on the next login (Fase 11C)', async ({ page }) => {
    const temporaryPassword = 'TempPass456!'
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto('/account')

    await page.fill('#current_password', DEMO_PASSWORD)
    await page.fill('#new_password', temporaryPassword)
    await page.fill('#new_password_confirmation', temporaryPassword)
    await page.getByRole('button', { name: 'Cambiar contraseña' }).click()
    await expect(page.getByText('Contraseña actualizada.')).toBeVisible()

    // Confirm the new password actually works, then restore the original
    // password through the same UI so the shared demo account keeps
    // working for every other test in the suite — even if this fails.
    try {
      await apiRequest(page, 'POST', '/api/auth/logout')
      await login(page, DEMO_EMAIL, temporaryPassword)
      await page.goto('/account')
      await page.fill('#current_password', temporaryPassword)
      await page.fill('#new_password', DEMO_PASSWORD)
      await page.fill('#new_password_confirmation', DEMO_PASSWORD)
      await page.getByRole('button', { name: 'Cambiar contraseña' }).click()
      await expect(page.getByText('Contraseña actualizada.')).toBeVisible()
    } catch (err) {
      await apiRequest(page, 'POST', '/api/auth/logout')
      await login(page, DEMO_EMAIL, temporaryPassword)
      await apiRequest(page, 'PUT', '/api/password', {
        current_password: temporaryPassword,
        password: DEMO_PASSWORD,
        password_confirmation: DEMO_PASSWORD,
      })
      throw err
    }
  })
})
