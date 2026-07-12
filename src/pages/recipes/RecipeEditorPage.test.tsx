import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import RecipeEditorPage from './RecipeEditorPage'
import { server } from '@/test/server'
import { ToastProvider } from '@/components/ui/toast'
import type { Food, RecipePreview } from '@/api/generated/model'

const richFood: Food = {
  id: 1,
  name: 'Espinaca cocida',
  category: 'Verduras',
  brand: null,
  data_type: 'generic',
  is_verified: true,
  is_demo: false,
  serving_size: null,
  serving_unit: null,
  visibility: 'public',
  origin_type: 'catalog',
  data_quality_status: 'verified',
  is_own: false,
  is_favorite: false,
  source: 'FDC',
  source_version: '1.0',
  nutrients: [
    {
      code: 'energy_kcal',
      name: 'Energía',
      amount_per_100g: 23,
      unit: 'kcal',
      data_origin: 'external_import',
      quality_status: 'source_reported',
      source_reference: '208',
      is_estimated: false,
    },
    {
      code: 'iron_mg',
      name: 'Hierro',
      amount_per_100g: 3.6,
      unit: 'mg',
      data_origin: 'external_import',
      quality_status: 'source_reported',
      source_reference: '303',
      is_estimated: false,
    },
    {
      code: 'calcium_mg',
      name: 'Calcio',
      amount_per_100g: 99,
      unit: 'mg',
      data_origin: 'external_import',
      quality_status: 'source_reported',
      source_reference: '301',
      is_estimated: false,
    },
  ],
}

const sparseFood: Food = {
  ...richFood,
  id: 2,
  name: 'Alimento con pocos datos',
  nutrients: [
    {
      code: 'energy_kcal',
      name: 'Energía',
      amount_per_100g: 50,
      unit: 'kcal',
      data_origin: 'user_entered',
      quality_status: 'user_reported',
      source_reference: null,
      is_estimated: false,
    },
  ],
}

const previewFixture: RecipePreview = {
  totals: { energy_kcal: 73 },
  per_100g: { energy_kcal: 36.5 },
  per_serving: { energy_kcal: 18.25 },
  serving_weight_g: 50,
  warnings: ['Uno o más ingredientes tienen datos parciales de nutrientes.'],
  has_incomplete_nutrients: true,
  limitations: ['Los cálculos incluyen únicamente los alimentos registrados.'],
}

function renderEditor() {
  return render(
    <MemoryRouter initialEntries={['/recipes/new']}>
      <ToastProvider>
        <Routes>
          <Route path="/recipes/new" element={<RecipeEditorPage />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('RecipeEditorPage — micronutrient availability preview', () => {
  it('shows micronutrient availability per selected ingredient without loading 16 manual inputs', async () => {
    const user = userEvent.setup()
    server.use(http.get('/api/foods', () => HttpResponse.json({ data: [richFood] })))

    renderEditor()

    await user.type(screen.getByPlaceholderText('Buscar alimento...'), 'espinaca')
    await user.click(await screen.findByText('Espinaca cocida'))

    expect(await screen.findByText(/micronutrientes conocidos: 2\/10/i)).toBeInTheDocument()
    // No 16 manual micronutrient inputs are rendered in the editor.
    expect(screen.queryByLabelText(/vitamina b12/i)).not.toBeInTheDocument()
  })

  it('warns when an ingredient has partial/unknown micronutrient coverage', async () => {
    const user = userEvent.setup()
    server.use(http.get('/api/foods', () => HttpResponse.json({ data: [sparseFood] })))

    renderEditor()

    await user.type(screen.getByPlaceholderText('Buscar alimento...'), 'pocos')
    await user.click(await screen.findByText('Alimento con pocos datos'))

    expect(await screen.findByText(/puede subestimar el total de la receta/i)).toBeInTheDocument()
  })

  it('uses the server-side preview endpoint and never recalculates authoritative totals client-side', async () => {
    const user = userEvent.setup()
    let previewCalled = false
    server.use(
      http.get('/api/foods', () => HttpResponse.json({ data: [richFood] })),
      http.post('/api/recipes/preview', () => {
        previewCalled = true
        return HttpResponse.json(previewFixture)
      }),
    )

    renderEditor()

    await user.type(screen.getByPlaceholderText('Buscar alimento...'), 'espinaca')
    await user.click(await screen.findByText('Espinaca cocida'))

    await waitFor(() => expect(previewCalled).toBe(true))
    expect(await screen.findByText('Vista previa')).toBeInTheDocument()
    // The energy total rendered comes straight from the server preview response (per_100g: 36.5, rounded for display), not a client computation.
    expect(await screen.findByText(/37\s*kcal/)).toBeInTheDocument()
  })
})
