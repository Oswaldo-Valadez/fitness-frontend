import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import MicronutrientsCard from './MicronutrientsCard'
import { server } from '@/test/server'
import { periodIntakeFixture } from '@/test/handlers/nutrients'

function renderCard() {
  return render(
    <MemoryRouter>
      <MicronutrientsCard />
    </MemoryRouter>,
  )
}

describe('MicronutrientsCard', () => {
  it('shows complete/partial/no-data counts and a CTA into the full report', async () => {
    renderCard()

    expect(await screen.findByText('Micronutrientes')).toBeInTheDocument()
    // Fixture: 1 complete (sodium), 1 partial (calcium), 1 no_data (vitamin B12).
    expect(screen.getByText(/con datos completos/)).toHaveTextContent('1 con datos completos')
    expect(screen.getByText(/parciales/)).toHaveTextContent('1 parciales')
    expect(screen.getByText(/sin dato/)).toHaveTextContent('1 sin dato')
    expect(screen.getByRole('link', { name: 'Ver nutrientes' })).toHaveAttribute('href', '/reports/nutrients')
  })

  it('never ranks or highlights "worst nutrients"', async () => {
    renderCard()

    await screen.findByText('Micronutrientes')
    for (const banned of [/peor/i, /peores nutrientes/i, /ranking/i]) {
      expect(screen.queryByText(banned)).not.toBeInTheDocument()
    }
  })

  it('shows an empty message when there are no nutrients in the period', async () => {
    server.use(http.get('/api/nutrition/intake/period', () => HttpResponse.json({ ...periodIntakeFixture, nutrients: [] })))

    renderCard()

    expect(await screen.findByText(/aún no hay datos de nutrientes/i)).toBeInTheDocument()
  })

  it('stays quiet (renders nothing) when the module fails to load', async () => {
    server.use(http.get('/api/nutrition/intake/period', () => HttpResponse.json({ message: 'Error' }, { status: 500 })))

    const { container } = renderCard()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(container).toBeEmptyDOMElement()
  })
})
