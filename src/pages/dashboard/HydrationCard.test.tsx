import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import HydrationCard from './HydrationCard'
import { server } from '@/test/server'
import { hydrationDailyFixture } from '@/test/handlers/hydration'

function renderCard() {
  return render(
    <MemoryRouter>
      <HydrationCard />
    </MemoryRouter>,
  )
}

describe('HydrationCard', () => {
  it('shows today’s plain water and a CTA into the water tab', async () => {
    renderCard()

    expect(await screen.findByText('Agua registrada hoy')).toBeInTheDocument()
    expect(screen.getByText(/de agua simple/)).toHaveTextContent('0.5 L de agua simple')
    expect(screen.getByRole('link', { name: 'Registrar agua' })).toHaveAttribute('href', '/diary/water')
  })

  it('never shows the AI as a simple percentage goal', async () => {
    renderCard()

    await screen.findByText('Agua registrada hoy')
    for (const banned of [/%/, /porcentaje/i, /faltan/i]) {
      expect(screen.queryByText(banned)).not.toBeInTheDocument()
    }
  })

  it('shows an empty message when there is no data today', async () => {
    server.use(
      http.get('/api/hydration/daily', () =>
        HttpResponse.json({
          ...hydrationDailyFixture,
          status: 'no_data',
          plain_water_logged_ml: 0,
          entries: [],
        }),
      ),
    )

    renderCard()

    expect(await screen.findByText(/aún no registras agua hoy/i)).toBeInTheDocument()
  })

  it('stays quiet (renders nothing) when the module fails to load', async () => {
    server.use(http.get('/api/hydration/daily', () => HttpResponse.json({ message: 'Error' }, { status: 500 })))

    const { container } = renderCard()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(container).toBeEmptyDOMElement()
  })
})
