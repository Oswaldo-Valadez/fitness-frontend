import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import DietQualityCard from './DietQualityCard'
import { server } from '@/test/server'
import { summaryFixture } from '@/test/handlers/dietQuality'

function renderCard() {
  return render(
    <MemoryRouter>
      <DietQualityCard />
    </MemoryRouter>,
  )
}

describe('DietQualityCard', () => {
  it('shows the latest score, age and active goals with a CTA', async () => {
    renderCard()

    expect(await screen.findByText('9/14')).toBeInTheDocument()
    expect(screen.getByText(/evaluado hace 12 días/i)).toBeInTheDocument()
    expect(screen.getByText('1 meta activa')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver calidad de dieta' })).toHaveAttribute('href', '/reports/quality')
  })

  it('shows the no-assessment state', async () => {
    server.use(
      http.get('/api/diet-quality/summary', () =>
        HttpResponse.json({
          ...summaryFixture,
          latest_assessment: null,
          previous_assessment: null,
          score_delta: null,
          history: [],
          component_summary: [],
          focus_candidates: [],
          active_goals: [],
          goal_progress: [],
          assessment_age_days: null,
          can_retake: true,
        }),
      ),
    )

    renderCard()

    expect(await screen.findByText(/aún no tienes evaluaciones/i)).toBeInTheDocument()
  })

  it('renders nothing when the module fails to load', async () => {
    server.use(http.get('/api/diet-quality/summary', () => HttpResponse.json({ message: 'boom' }, { status: 500 })))

    const { container } = renderCard()

    await screen.findByText(/./, undefined, { timeout: 50 }).catch(() => undefined)
    // The card removes itself instead of adding noise to the dashboard
    expect(container).toBeEmptyDOMElement()
  })
})
