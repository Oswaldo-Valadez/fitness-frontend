import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import HydrationQuickAdd from './HydrationQuickAdd'
import { ToastProvider } from '@/components/ui/toast'
import { server } from '@/test/server'

function renderQuickAdd(onAdded = vi.fn()) {
  render(
    <ToastProvider>
      <HydrationQuickAdd onAdded={onAdded} />
    </ToastProvider>,
  )
  return { onAdded }
}

describe('HydrationQuickAdd', () => {
  it('renders quick-add buttons as accesses, not recommendations, plus an "Otro" custom option', () => {
    renderQuickAdd()

    for (const label of ['250 ml', '350 ml', '500 ml', '750 ml']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Otro' })).toBeInTheDocument()
  })

  it('quick-adds a volume with a fresh idempotency key and calls onAdded', async () => {
    const user = userEvent.setup()
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('/api/hydration/entries', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 1, volume_ml: 500, occurred_at: '2026-07-05T15:00:00+00:00', local_date: '2026-07-05', note: null }, { status: 201 })
      }),
    )

    const { onAdded } = renderQuickAdd()
    await user.click(screen.getByRole('button', { name: '500 ml' }))

    await waitFor(() => expect(onAdded).toHaveBeenCalled())
    expect(body).not.toBeNull()
    expect(body!.volume_ml).toBe(500)
    expect(typeof body!.idempotency_key).toBe('string')
    expect((body!.idempotency_key as string).length).toBeGreaterThan(0)
  })

  it('opens a custom-amount input and submits it', async () => {
    const user = userEvent.setup()
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('/api/hydration/entries', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 2, volume_ml: 333, occurred_at: '2026-07-05T15:00:00+00:00', local_date: '2026-07-05', note: null }, { status: 201 })
      }),
    )

    const { onAdded } = renderQuickAdd()
    await user.click(screen.getByRole('button', { name: 'Otro' }))
    await user.type(screen.getByLabelText('Volumen (ml)'), '333')
    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    await waitFor(() => expect(onAdded).toHaveBeenCalled())
    expect(body!.volume_ml).toBe(333)
  })

  it('rolls back (no onAdded, error shown) when the request fails', async () => {
    const user = userEvent.setup()
    server.use(http.post('/api/hydration/entries', () => HttpResponse.json({ message: 'Límite diario alcanzado.' }, { status: 422 })))

    const { onAdded } = renderQuickAdd()
    await user.click(screen.getByRole('button', { name: '250 ml' }))

    await waitFor(() => expect(screen.getByText(/límite diario alcanzado/i)).toBeInTheDocument())
    expect(onAdded).not.toHaveBeenCalled()
  })

  it('shows a loading state while a quick-add request is in flight', async () => {
    const user = userEvent.setup()
    const deferred: { resolve?: () => void } = {}
    server.use(
      http.post('/api/hydration/entries', async () => {
        await new Promise<void>((resolve) => {
          deferred.resolve = resolve
        })
        return HttpResponse.json({ id: 3, volume_ml: 250, occurred_at: '2026-07-05T15:00:00+00:00', local_date: '2026-07-05', note: null }, { status: 201 })
      }),
    )

    renderQuickAdd()
    const button = screen.getByRole('button', { name: '250 ml' })
    await user.click(button)

    expect(button).toBeDisabled()
    deferred.resolve?.()
  })
})
