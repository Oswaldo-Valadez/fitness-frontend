import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import DietQualityAssessmentPage from './DietQualityAssessmentPage'
import { ToastProvider } from '@/components/ui/toast'
import { server } from '@/test/server'
import { assessmentFixture, instrumentFixture } from '@/test/handlers/dietQuality'

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/reports/quality/assessment']}>
      <ToastProvider>
        <Routes>
          <Route path="/reports/quality/assessment" element={<DietQualityAssessmentPage />} />
          <Route path="/reports/quality/assessments/:id" element={<div>detalle de evaluación</div>} />
          <Route path="/reports/quality" element={<div>hub calidad</div>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

/** Walks the wizard answering every question; returns the userEvent instance. */
async function answerAllQuestions(user: ReturnType<typeof userEvent.setup>) {
  for (const question of instrumentFixture.questions) {
    await screen.findByText(question.prompt)
    if (question.answer_type === 'boolean') {
      await user.click(screen.getByRole('button', { name: 'Sí' }))
    } else {
      await user.type(screen.getByLabelText(/cantidad/i), '3')
    }
    await user.click(screen.getByRole('button', { name: /siguiente|revisar respuestas/i }))
  }
}

describe('DietQualityAssessmentPage', () => {
  it('loads the instrument and walks through all 14 questions to review', async () => {
    const user = userEvent.setup()
    renderWizard()

    expect(await screen.findByText('Pregunta 1 de 14')).toBeInTheDocument()

    await answerAllQuestions(user)

    expect(await screen.findByText('Revisa tus respuestas')).toBeInTheDocument()
    // All 14 prompts listed for review
    for (const question of instrumentFixture.questions) {
      expect(screen.getByText(question.prompt)).toBeInTheDocument()
    }
  })

  it('validates numeric answers before advancing', async () => {
    const user = userEvent.setup()
    renderWizard()

    // Q1 boolean
    await screen.findByText('Pregunta 1 de 14')
    await user.click(screen.getByRole('button', { name: 'Sí' }))
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    // Q2 numeric: empty rejected
    await screen.findByText('Pregunta 2 de 14')
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(await screen.findByText('Ingresa un número para continuar.')).toBeInTheDocument()

    // Non-numeric rejected
    await user.type(screen.getByLabelText(/cantidad/i), 'abc')
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(await screen.findByText('Ingresa un número válido.')).toBeInTheDocument()

    expect(screen.getByText('Pregunta 2 de 14')).toBeInTheDocument()
  })

  it('shows the alcohol safety notice on the wine step without negative styling for 0', async () => {
    const user = userEvent.setup()
    renderWizard()

    await screen.findByText('Pregunta 1 de 14')
    // Advance to question 8 (wine)
    for (let i = 0; i < 7; i++) {
      const question = instrumentFixture.questions[i]
      if (question.answer_type === 'boolean') {
        await user.click(screen.getByRole('button', { name: 'Sí' }))
      } else {
        await user.type(screen.getByLabelText(/cantidad/i), '2')
      }
      await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    }

    expect(await screen.findByText('¿Cuántas copas de vino consumes por semana?')).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent(/no comiences ni aumentes el consumo de alcohol/i)

    const input = screen.getByLabelText(/cantidad/i)
    await user.type(input, '0')
    expect(input).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('submits the payload with real JSON types and navigates to the result', async () => {
    const user = userEvent.setup()
    const postSpy = vi.fn()
    server.use(
      http.post('/api/diet-quality/assessments', async ({ request }) => {
        postSpy(await request.json())
        return HttpResponse.json({ assessment: assessmentFixture }, { status: 201 })
      }),
    )

    renderWizard()
    await screen.findByText('Pregunta 1 de 14')
    await answerAllQuestions(user)
    await user.click(await screen.findByRole('button', { name: 'Enviar evaluación' }))

    await waitFor(() => expect(postSpy).toHaveBeenCalledTimes(1))
    const payload = postSpy.mock.calls[0][0]
    expect(payload.instrument_code).toBe('medas_14')
    expect(payload.instrument_version).toBe('1.0.0')
    expect(payload.answers.olive_oil_main_fat).toBe(true)
    expect(payload.answers.vegetable_servings_day).toBe(3)
    expect(Object.keys(payload.answers)).toHaveLength(14)

    expect(await screen.findByText('detalle de evaluación')).toBeInTheDocument()
  })

  it('reloads the instrument and asks for review on 409 version mismatch', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('/api/diet-quality/assessments', () =>
        HttpResponse.json(
          {
            message: 'La versión del instrumento cambió. Actualiza el cuestionario antes de enviarlo.',
            code: 'INSTRUMENT_VERSION_OUTDATED',
            requested_version: '1.0.0',
            current_version: '1.1.0',
          },
          { status: 409 },
        ),
      ),
      http.get('/api/diet-quality/instruments/medas-14', () => HttpResponse.json({ instrument: { ...instrumentFixture, version: '1.1.0' } })),
    )

    renderWizard()
    await screen.findByText('Pregunta 1 de 14')
    await answerAllQuestions(user)
    await user.click(await screen.findByRole('button', { name: 'Enviar evaluación' }))

    // Wizard restarts on the refreshed instrument, keeping answers in memory
    expect(await screen.findByText(/la versión del cuestionario se actualizó a 1\.1\.0/i)).toBeInTheDocument()
    expect(screen.getByText('Pregunta 1 de 14')).toBeInTheDocument()
  })
})
