import { expect, test } from '@playwright/test'
test.describe('templates, copy meal, weight, reports, exports', () => {
  test('save a meal as a template, then apply it back into the diary', async ({ page }) => {
    await page.goto('/diary')

    await page.fill('#food-query', 'Manzana fresca')
    await page
      .getByRole('option', { name: /Manzana fresca/ })
      .first()
      .click()
    await page.getByRole('button', { name: '+ Snack' }).click()
    await expect(page.getByText(/Agregado a snack/i)).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept(`Snack E2E ${Date.now()}`))
    await page.getByRole('button', { name: 'Guardar como plantilla' }).click()
    await expect(page.getByText('Plantilla guardada.')).toBeVisible()

    await page.goto('/library/templates')
    await page.getByRole('button', { name: 'Aplicar' }).first().click()
    await page.getByRole('button', { name: 'Aplicar al diario' }).click()
    await expect(page.getByText('Plantilla aplicada al diario.')).toBeVisible()
  })

  test('copy a meal to another date', async ({ page }) => {
    await page.goto('/diary')

    await page.fill('#food-query', 'Frijoles negros')
    await page
      .getByRole('option', { name: /Frijoles negros/ })
      .first()
      .click()
    await page.getByRole('button', { name: '+ Comida' }).click()
    await expect(page.getByText(/Agregado a comida/i)).toBeVisible()

    await page.getByRole('button', { name: 'Copiar a otra fecha' }).first().click()
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    await page.fill('#copy-target-date', tomorrow)
    await page.getByRole('button', { name: 'Copiar', exact: true }).click()
    await expect(page.getByText(/Comida copiada/)).toBeVisible()
  })

  test("register today's weight from the profile page", async ({ page }) => {
    await page.goto('/profile')

    await page.getByRole('button', { name: 'Registrar' }).click()
    await page.fill('#weight-input', '71.5')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('71.5 kg')).toBeVisible()
  })

  test('the reports page shows coverage and both JSON/CSV exports trigger a download', async ({ page }) => {
    await page.goto('/reports')

    await expect(page.getByText('Cobertura')).toBeVisible()

    const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'JSON' }).click()])
    expect(jsonDownload.suggestedFilename()).toMatch(/\.json$/)

    const [csvDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'CSV' }).click()])
    expect(csvDownload.suggestedFilename()).toMatch(/\.csv$/)
  })

  test('account data export triggers a download', async ({ page }) => {
    await page.goto('/account')

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar mis datos' }).click()])
    expect(download.suggestedFilename()).toMatch(/\.json$/)
  })
})
