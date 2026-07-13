import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import HydrationPage from './HydrationPage'
import { ToastProvider } from '@/components/ui/toast'
import { server } from '@/test/server'
import { hydrationDailyFixture } from '@/test/handlers/hydration'

function renderPage(initialEntries = ['/diary/water?date=2026-07-05']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <HydrationPage />
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('HydrationPage', () => {
  it('shows plain water, dietary water and total as separate figures — never fused', async () => {
    server.use(
      http.get('/api/hydration/daily', () =>
        HttpResponse.json({
          ...hydrationDailyFixture,
          plain_water_logged_ml: 1500,
          dietary_water_ml: 620,
          estimated_total_water_ml: 2120,
          status: 'complete',
        }),
      ),
    )

    renderPage()

    expect(await screen.findByText('1,500 ml')).toBeInTheDocument()
    expect(screen.getByText('620 ml')).toBeInTheDocument()
    expect(screen.getByText('2,120 ml')).toBeInTheDocument()
  })

  it('shows partial coverage as indeterminate — never a percentage or a "missing ml" figure', async () => {
    renderPage()

    await screen.findByText('Hidratación')
    expect(screen.getByText(/cobertura parcial/i)).toBeInTheDocument()
    // "porcentaje" legitimately appears in the disclaimer text DENYING the
    // concept ("no es una meta ni un porcentaje de hidratación") — the ban is
    // on a numeric percentage / missing-ml prescription, not the word itself.
    for (const banned of [/\d+\s*%/, /faltan \d/i, /bebe ahora/i]) {
      expect(screen.queryByText(banned)).not.toBeInTheDocument()
    }
  })

  it('shows the complete comparison as a neutral range band, never a goal-met message', async () => {
    server.use(
      http.get('/api/hydration/daily', () =>
        HttpResponse.json({
          ...hydrationDailyFixture,
          status: 'complete',
          comparison: 'within_reference_range',
          dietary_water_ml: 2200,
          estimated_total_water_ml: 2700,
        }),
      ),
    )

    renderPage()

    await screen.findByText('Hidratación')
    expect(screen.queryByText(/meta cumplida/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/¡bien hecho!/i)).not.toBeInTheDocument()
  })

  it('shows an honest range (never a midpoint) for an undisclosed profile', async () => {
    renderPage()

    expect(await screen.findByText(/2,700–3,700 ml/)).toBeInTheDocument()
    expect(screen.queryByText('3,200 ml')).not.toBeInTheDocument()
  })

  it('quick-adds water and refreshes the summary', async () => {
    const user = userEvent.setup()
    let created = false
    server.use(
      http.post('/api/hydration/entries', () => {
        created = true
        return HttpResponse.json({ id: 99, volume_ml: 250, occurred_at: '2026-07-05T16:00:00+00:00', local_date: '2026-07-05', note: null }, { status: 201 })
      }),
    )

    renderPage()
    await screen.findByText('Hidratación')
    await user.click(screen.getByRole('button', { name: '250 ml' }))

    await waitFor(() => expect(created).toBe(true))
  })

  it('edits an existing entry', async () => {
    const user = userEvent.setup()
    let updateBody: Record<string, unknown> | null = null
    server.use(
      http.put('/api/hydration/entries/:id', async ({ request }) => {
        updateBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 1, volume_ml: 350, occurred_at: '2026-07-05T15:30:00+00:00', local_date: '2026-07-05', note: 'Vaso grande' })
      }),
    )

    renderPage()
    await screen.findByText('Hidratación')

    await user.click(screen.getByRole('button', { name: /editar registro de 500 ml/i }))
    const volumeInput = await screen.findByLabelText('Volumen (ml)')
    await user.clear(volumeInput)
    await user.type(volumeInput, '350')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(updateBody).not.toBeNull())
    expect(updateBody!.volume_ml).toBe(350)
  })

  it('deletes an entry after confirmation', async () => {
    const user = userEvent.setup()
    let deleted = false
    server.use(
      http.delete('/api/hydration/entries/:id', () => {
        deleted = true
        return HttpResponse.json({ message: 'Registro eliminado.' })
      }),
    )

    renderPage()
    await screen.findByText('Hidratación')

    await user.click(screen.getByRole('button', { name: /eliminar registro de 500 ml/i }))
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => expect(deleted).toBe(true))
  })

  it('shows an API error message when the daily summary fails to load', async () => {
    server.use(http.get('/api/hydration/daily', () => HttpResponse.json({ message: 'Error interno' }, { status: 500 })))

    renderPage()

    expect(await screen.findByText('No fue posible cargar la información')).toBeInTheDocument()
    expect(screen.queryByText('Hidratación')).not.toBeInTheDocument()
  })

  it('shows the no-dedup notice, never attempting to infer duplicates', async () => {
    renderPage()

    expect(await screen.findAllByText(/evita registrar la misma agua/i)).not.toHaveLength(0)
  })
})
