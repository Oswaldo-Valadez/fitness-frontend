import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import HydrationReportPage from './HydrationReportPage'
import { server } from '@/test/server'
import { hydrationPeriodFixture } from '@/test/handlers/hydration'

function renderPage() {
  return render(
    <MemoryRouter>
      <HydrationReportPage />
    </MemoryRouter>,
  )
}

describe('HydrationReportPage', () => {
  it('shows the period summary and an accessible daily table', async () => {
    renderPage()

    expect(await screen.findByText('Hidratación')).toBeInTheDocument()

    const table = screen.getByRole('table', { name: /historial diario de hidrataci[oó]n registrada/i })
    expect(within(table).getByText('500 ml')).toBeInTheDocument()
    // A day with no data at all shows the null placeholder, not a fabricated zero.
    expect(within(table).getAllByText('—').length).toBeGreaterThan(0)
  })

  it('switches between 7/30/90-day periods', async () => {
    const user = userEvent.setup()
    let requestedPeriod: string | null = null
    server.use(
      http.get('/api/hydration/period', ({ request }) => {
        requestedPeriod = new URL(request.url).searchParams.get('period')
        return HttpResponse.json(hydrationPeriodFixture)
      }),
    )

    renderPage()
    await screen.findByText('Hidratación')

    await user.click(screen.getByRole('button', { name: '7 días' }))
    expect(requestedPeriod).toBe('7')

    await user.click(screen.getByRole('button', { name: '90 días' }))
    expect(requestedPeriod).toBe('90')
  })

  it('shows the AI reference as a range, never a percentage or forecast', async () => {
    renderPage()

    expect(await screen.findByText(/2,700–3,700 ml/)).toBeInTheDocument()
    expect(screen.queryByText(/pron[oó]stico/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/racha/i)).not.toBeInTheDocument()
  })

  it('shows a no-results message for an empty period', async () => {
    server.use(
      http.get('/api/hydration/period', () =>
        HttpResponse.json({
          ...hydrationPeriodFixture,
          daily_points: [],
        }),
      ),
    )

    renderPage()

    expect(await screen.findByText(/sin d[ií]as registrados en este periodo/i)).toBeInTheDocument()
  })
})
