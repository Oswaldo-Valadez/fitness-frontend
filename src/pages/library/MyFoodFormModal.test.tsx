import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import MyFoodFormModal from './MyFoodFormModal'
import { server } from '@/test/server'

function renderModal(onSaved = vi.fn()) {
  render(<MyFoodFormModal open onClose={vi.fn()} onSaved={onSaved} food={null} />)
  return { onSaved }
}

describe('MyFoodFormModal — micronutrientes opcionales (blank vs zero)', () => {
  it('renders a collapsible "Micronutrientes opcionales" section with all 10 new fields', () => {
    renderModal()

    expect(screen.getByText('Micronutrientes opcionales')).toBeInTheDocument()
    for (const label of [/calcio/i, /hierro/i, /magnesio/i, /potasio/i, /^zinc/i, /vitamina a/i, /vitamina c/i, /vitamina d/i, /vitamina b12/i, /folato/i]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
  })

  it('sends null for a blank optional micronutrient and 0 for an explicit zero — never coerces blank to 0', async () => {
    const user = userEvent.setup()
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('/api/my-foods', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ food: { id: 1 } }, { status: 201 })
      }),
    )

    renderModal()

    await user.type(screen.getByLabelText(/^Nombre/), 'Alimento de prueba')
    await user.type(screen.getByLabelText('Kcal/100g'), '100')

    // Iron is filled with a real zero; vitamin D is left blank.
    await user.type(screen.getByLabelText(/hierro/i), '0')

    await user.click(screen.getByRole('button', { name: 'Crear alimento' }))

    await waitFor(() => expect(body).not.toBeNull())
    const nutrients = body!.nutrients as Record<string, number | null>
    expect(nutrients.iron_mg).toBe(0)
    expect(nutrients.vitamin_d_mcg).toBeNull()
    expect(nutrients.calcium_mg).toBeNull()
  })

  it('persists a filled-in micronutrient value as a number', async () => {
    const user = userEvent.setup()
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('/api/my-foods', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ food: { id: 1 } }, { status: 201 })
      }),
    )

    renderModal()

    await user.type(screen.getByLabelText(/^Nombre/), 'Alimento de prueba')
    await user.type(screen.getByLabelText(/calcio/i), '120')

    await user.click(screen.getByRole('button', { name: 'Crear alimento' }))

    await waitFor(() => expect(body).not.toBeNull())
    const nutrients = body!.nutrients as Record<string, number | null>
    expect(nutrients.calcium_mg).toBe(120)
  })

  it('shows the blank-means-unknown helper text and never shows a zero default in an empty field', () => {
    renderModal()

    expect(screen.getAllByText(/se guardará como/i).length).toBeGreaterThan(0)
    expect(screen.getByLabelText(/vitamina d/i)).toHaveValue(null)
  })
})
