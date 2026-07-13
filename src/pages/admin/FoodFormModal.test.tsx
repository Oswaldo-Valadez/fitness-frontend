import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import FoodFormModal from './FoodFormModal'
import { server } from '@/test/server'

function renderModal(onSaved = vi.fn()) {
  server.use(http.get('/api/admin/food-sources', () => HttpResponse.json([{ id: 1, name: 'Fuente de prueba' }])))
  render(<FoodFormModal open onClose={vi.fn()} onSaved={onSaved} food={null} />)
  return { onSaved }
}

describe('FoodFormModal — Sprint 5D: admin dynamic nutrients (not limited to the six legacy fields)', () => {
  it('renders a collapsible "Micronutrientes opcionales" section including water_ml', async () => {
    renderModal()

    await screen.findByLabelText(/^Fuente/)
    expect(screen.getByText('Micronutrientes opcionales')).toBeInTheDocument()
    for (const label of [/calcio/i, /hierro/i, /vitamina d/i, /folato/i, /agua \(del alimento\)/i]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
  })

  it('sends null for a blank optional nutrient and 0 for an explicit zero — never coerces blank to 0', async () => {
    const user = userEvent.setup()
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('/api/admin/foods', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 1, name: 'Sopa' }, { status: 201 })
      }),
    )

    renderModal()
    await screen.findByLabelText(/^Fuente/)

    await user.type(screen.getByLabelText(/^Nombre/), 'Sopa de verduras')
    await user.selectOptions(screen.getByLabelText(/^Fuente/), '1')
    await user.type(screen.getByLabelText(/^Kcal\/100g/), '50')
    await user.type(screen.getByLabelText(/^Proteína/), '2')
    await user.type(screen.getByLabelText(/^Carbos/), '5')
    await user.type(screen.getByLabelText(/^Grasa/), '1')

    // Iron filled with a real zero; water_ml left blank.
    await user.type(screen.getByLabelText(/hierro/i), '0')

    await user.click(screen.getByRole('button', { name: 'Crear alimento' }))

    await waitFor(() => expect(body).not.toBeNull())
    const nutrients = body!.nutrients as Record<string, number | null>
    expect(nutrients.iron_mg).toBe(0)
    expect(nutrients.water_ml).toBeNull()
    expect(nutrients.calcium_mg).toBeNull()
  })

  it('persists a filled-in water_ml value distinct from blank', async () => {
    const user = userEvent.setup()
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('/api/admin/foods', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 1, name: 'Sopa' }, { status: 201 })
      }),
    )

    renderModal()
    await screen.findByLabelText(/^Fuente/)

    await user.type(screen.getByLabelText(/^Nombre/), 'Sopa de verduras')
    await user.selectOptions(screen.getByLabelText(/^Fuente/), '1')
    await user.type(screen.getByLabelText(/^Kcal\/100g/), '50')
    await user.type(screen.getByLabelText(/^Proteína/), '2')
    await user.type(screen.getByLabelText(/^Carbos/), '5')
    await user.type(screen.getByLabelText(/^Grasa/), '1')
    await user.type(screen.getByLabelText(/agua \(del alimento\)/i), '85.5')

    await user.click(screen.getByRole('button', { name: 'Crear alimento' }))

    await waitFor(() => expect(body).not.toBeNull())
    const nutrients = body!.nutrients as Record<string, number | null>
    expect(nutrients.water_ml).toBe(85.5)
  })

  it('shows a generic error message and does not call onSaved when the API rejects (e.g. unknown nutrient / 422)', async () => {
    const user = userEvent.setup()
    server.use(http.post('/api/admin/foods', () => HttpResponse.json({ message: "El nutriente 'x' no existe en el catálogo." }, { status: 422 })))

    const { onSaved } = renderModal()
    await screen.findByLabelText(/^Fuente/)

    await user.type(screen.getByLabelText(/^Nombre/), 'Alimento inválido')
    await user.selectOptions(screen.getByLabelText(/^Fuente/), '1')
    await user.type(screen.getByLabelText(/^Kcal\/100g/), '50')
    await user.type(screen.getByLabelText(/^Proteína/), '2')
    await user.type(screen.getByLabelText(/^Carbos/), '5')
    await user.type(screen.getByLabelText(/^Grasa/), '1')

    await user.click(screen.getByRole('button', { name: 'Crear alimento' }))

    await waitFor(() => expect(screen.getByText(/no se pudo guardar el alimento/i)).toBeInTheDocument())
    expect(onSaved).not.toHaveBeenCalled()
  })
})
