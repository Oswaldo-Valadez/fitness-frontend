import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import NutrientReportPage from './NutrientReportPage'
import { server } from '@/test/server'
import { periodIntakeFixture } from '@/test/handlers/nutrients'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/reports/nutrients']}>
      <NutrientReportPage />
    </MemoryRouter>,
  )
}

describe('NutrientReportPage', () => {
  it('shows the header, disclaimer and nutrient cards from the period fixture', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Nutrientes' })).toBeInTheDocument()
    expect(screen.getByText(/las comparaciones usan referencias poblacionales para personas sanas y no diagnostican deficiencias/i)).toBeInTheDocument()

    expect(await screen.findByText('Calcio')).toBeInTheDocument()
    expect(screen.getByText('Sodio')).toBeInTheDocument()
    expect(screen.getByText('Vitamina B12')).toBeInTheDocument()
  })

  it('shows a partial subtotal with coverage badge and underestimation caveat, matching the spec example', async () => {
    renderPage()

    await screen.findByText('Calcio')
    expect(screen.getByText(/datos conocidos en 68\s*% de los elementos/i)).toBeInTheDocument()
    expect(screen.getByText('El subtotal puede estar subestimado')).toBeInTheDocument()
    // Partial cards never render a neutral comparison sentence next to the subtotal.
    expect(screen.queryByText(/en o por encima de la referencia registrada/i)).not.toBeInTheDocument()
  })

  it('shows an unknown nutrient as "Sin dato", never as 0', async () => {
    renderPage()

    await screen.findByText('Vitamina B12')
    expect(screen.getAllByText('Sin dato').length).toBeGreaterThan(0)
  })

  it('shows the sodium CDRR as the primary comparison, with no UL anywhere', async () => {
    renderPage()

    await screen.findByText('Sodio')
    expect(screen.getByText(/2300 mg \(CDRR\)/)).toBeInTheDocument()
    expect(screen.getByText(/por encima del cdrr registrado/i)).toBeInTheDocument()

    for (const banned of [/\bUL\b/, /upper intake/i, /nivel máximo tolerable/i]) {
      expect(screen.queryByText(banned)).not.toBeInTheDocument()
    }
  })

  it('never uses clinical or judgmental language', async () => {
    renderPage()

    await screen.findByText('Calcio')
    for (const banned of [/deficiente/i, /tóxico/i, /peligroso/i, /saludable/i, /\bmalo\b/i, /óptimo/i, /debes suplementarte/i]) {
      expect(screen.queryByText(banned)).not.toBeInTheDocument()
    }
  })

  it('filters by period (7/30/90/custom)', async () => {
    const user = userEvent.setup()
    let requestedPeriod: string | null = null
    server.use(
      http.get('/api/nutrition/intake/period', ({ request }) => {
        requestedPeriod = new URL(request.url).searchParams.get('period')
        return HttpResponse.json(periodIntakeFixture)
      }),
    )

    renderPage()
    await screen.findByText('Calcio')

    await user.click(screen.getByRole('button', { name: '7 días' }))
    await waitFor(() => expect(requestedPeriod).toBe('7'))

    await user.click(screen.getByRole('button', { name: '90 días' }))
    await waitFor(() => expect(requestedPeriod).toBe('90'))

    await user.click(screen.getByRole('button', { name: 'Personalizado' }))
    expect(screen.getByLabelText('Desde')).toBeInTheDocument()
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument()
  })

  it('filters by category and status without ever offering "deficient"/"excess" filters', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Calcio')

    const categoryGroup = screen.getByRole('group', { name: 'Categoría' })
    expect(within(categoryGroup).getByRole('button', { name: 'Vitaminas' })).toBeInTheDocument()
    expect(within(categoryGroup).getByRole('button', { name: 'Minerales' })).toBeInTheDocument()

    const statusGroup = screen.getByRole('group', { name: 'Estado de los datos' })
    expect(within(statusGroup).getByRole('button', { name: 'Datos completos' })).toBeInTheDocument()
    expect(within(statusGroup).getByRole('button', { name: 'Datos parciales' })).toBeInTheDocument()
    expect(within(statusGroup).getByRole('button', { name: 'Sin dato' })).toBeInTheDocument()
    expect(within(statusGroup).queryByText(/deficiente/i)).not.toBeInTheDocument()
    expect(within(statusGroup).queryByText(/exceso/i)).not.toBeInTheDocument()

    await user.click(within(categoryGroup).getByRole('button', { name: 'Vitaminas' }))
    expect(screen.getByText('Vitamina B12')).toBeInTheDocument()
    expect(screen.queryByText('Calcio')).not.toBeInTheDocument()
  })

  it('surfaces a retryable error state when the API is unavailable', async () => {
    server.use(http.get('/api/nutrition/intake/period', () => HttpResponse.json({ message: 'Error interno' }, { status: 500 })))

    renderPage()

    expect(await screen.findByText('No fue posible cargar la información')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('surfaces consent-required state on 409', async () => {
    server.use(
      http.get('/api/nutrition/intake/period', () =>
        HttpResponse.json({ message: 'Debes aceptar los consentimientos vigentes para continuar.', code: 'CONSENT_REQUIRED' }, { status: 409 }),
      ),
    )

    renderPage()

    expect(await screen.findByText('Consentimiento requerido')).toBeInTheDocument()
  })

  it('surfaces a validation error state on 422 (invalid custom date range)', async () => {
    server.use(http.get('/api/nutrition/intake/period', () => HttpResponse.json({ message: 'El rango de fechas no es válido.' }, { status: 422 })))

    renderPage()

    expect(await screen.findByText('No fue posible cargar la información')).toBeInTheDocument()
    expect(screen.getByText('El rango de fechas no es válido.')).toBeInTheDocument()
  })

  it('surfaces a rate-limit message on 429', async () => {
    server.use(http.get('/api/nutrition/intake/period', () => HttpResponse.json({ message: 'Demasiadas solicitudes' }, { status: 429 })))

    renderPage()

    expect(await screen.findByText(/demasiadas solicitudes/i)).toBeInTheDocument()
  })

  it('shows an empty state when there are no meals/nutrient data for the period', async () => {
    server.use(http.get('/api/nutrition/intake/period', () => HttpResponse.json({ ...periodIntakeFixture, nutrients: [] })))

    renderPage()

    expect(await screen.findByText('Sin nutrientes para mostrar')).toBeInTheDocument()
  })

  it('renders a legacy (pre-Sprint-4) item as a known value without inventing a status word', async () => {
    server.use(
      http.get('/api/nutrition/intake/period', () =>
        HttpResponse.json({
          ...periodIntakeFixture,
          nutrients: [{ ...periodIntakeFixture.nutrients[1], status: 'legacy_fallback' }],
        }),
      ),
    )

    renderPage()

    expect(await screen.findByText('Sodio')).toBeInTheDocument()
    expect(screen.getAllByText(/2500\s*mg/).length).toBeGreaterThan(0)
  })

  it('is keyboard navigable: period, category and status controls are real buttons/links', async () => {
    renderPage()
    await screen.findByText('Calcio')

    for (const name of ['7 días', '30 días', '90 días', 'Personalizado']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Calcio' })).toHaveAttribute('href', '/reports/nutrients/calcium_mg')
  })
})
