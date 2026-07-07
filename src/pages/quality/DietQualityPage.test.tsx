import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import DietQualityPage from './DietQualityPage'
import { ToastProvider } from '@/components/ui/toast'
import { server } from '@/test/server'
import { summaryFixture } from '@/test/handlers/dietQuality'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/reports/quality']}>
      <ToastProvider>
        <DietQualityPage />
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('DietQualityPage', () => {
  it('shows the score, delta and history table without clinical bands', async () => {
    renderPage()

    expect((await screen.findAllByText('9/14')).length).toBeGreaterThan(0)
    expect(screen.getByText(/\+2 respecto a tu evaluación anterior/)).toBeInTheDocument()

    // Accessible table fallback for the chart
    const table = screen.getByRole('table', { name: /historial de evaluaciones/i })
    expect(within(table).getByText('7/14')).toBeInTheDocument()

    // No clinical/judgemental language, ever
    for (const banned of [/riesgo/i, /excelente/i, /\bmalo\b/i, /percentil/i, /diagnóstico/i]) {
      expect(screen.queryByText(banned)).not.toBeInTheDocument()
    }
  })

  it('lists focus candidates but never alcohol nor olive-oil quantity', async () => {
    renderPage()

    expect((await screen.findAllByText('Porciones de leguminosas por semana')).length).toBeGreaterThan(0)
    expect(screen.getByText('Porciones de verduras al día')).toBeInTheDocument()

    expect(screen.queryByText(/copas de vino/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/cucharadas de aceite/i)).not.toBeInTheDocument()

    // The alcohol safety notice is visible in the focus section
    expect(screen.getByText(/no comiences ni aumentes el consumo de alcohol/i)).toBeInTheDocument()
  })

  it('creates a goal only after explicit confirmation', async () => {
    const user = userEvent.setup()
    const postSpy = vi.fn()
    server.use(
      http.post('/api/diet-quality/goals', async ({ request }) => {
        postSpy(await request.json())
        return HttpResponse.json({ goal: summaryFixture.active_goals[0] }, { status: 201 })
      }),
    )

    renderPage()

    await user.click((await screen.findAllByRole('button', { name: 'Elegir como meta' }))[0])
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(postSpy).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirmar meta' }))

    await waitFor(() => expect(postSpy).toHaveBeenCalledTimes(1))
    expect(postSpy.mock.calls[0][0]).toMatchObject({ focus_code: 'legume_servings_week', source_assessment_id: 42 })
  })

  it('shows neutral no_data progress without success language', async () => {
    server.use(
      http.get('/api/diet-quality/summary', () =>
        HttpResponse.json({
          ...summaryFixture,
          goal_progress: [
            {
              ...summaryFixture.goal_progress[0],
              recorded_value: null,
              remaining_value: null,
              comparison: 'no_data',
              data_points: 0,
              coverage_pct: 0,
            },
          ],
        }),
      ),
    )

    renderPage()

    expect(await screen.findByText(/sin datos suficientes/i)).toBeInTheDocument()
    expect(screen.queryByText(/¡felicidades/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/cumplida/i)).not.toBeInTheDocument()
  })

  it('submits a check-in through the modal (idempotent upsert endpoint)', async () => {
    const user = userEvent.setup()
    const putSpy = vi.fn()
    server.use(
      http.put('/api/diet-quality/goals/:id/check-ins/:date', async ({ request, params }) => {
        putSpy(params.date, await request.json())
        return HttpResponse.json({ check_in: { id: 1, diet_quality_goal_id: 7, local_date: String(params.date), value: 2, note: null } })
      }),
    )

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Registrar' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/valor/i), '2')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar registro' }))

    await waitFor(() => expect(putSpy).toHaveBeenCalledTimes(1))
    expect(putSpy.mock.calls[0][1]).toMatchObject({ value: 2, note: null })
  })

  it('shows the empty state when there is no assessment yet', async () => {
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
      http.get('/api/diet-quality/goals', () => HttpResponse.json({ goals: [], progress: [] })),
    )

    renderPage()

    expect(await screen.findByText('Aún no tienes evaluaciones')).toBeInTheDocument()
    expect(screen.getByText('Sin metas activas')).toBeInTheDocument()
  })

  it('surfaces consent-required state on 409', async () => {
    server.use(
      http.get('/api/diet-quality/summary', () =>
        HttpResponse.json({ message: 'Debes aceptar los consentimientos vigentes para continuar.', code: 'CONSENT_REQUIRED' }, { status: 409 }),
      ),
    )

    renderPage()

    expect(await screen.findByText('Consentimiento requerido')).toBeInTheDocument()
  })

  it('surfaces a retryable error state when the API is unavailable', async () => {
    server.use(http.get('/api/diet-quality/summary', () => HttpResponse.json({ message: 'Error interno' }, { status: 500 })))

    renderPage()

    expect(await screen.findByText('No fue posible cargar la información')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
