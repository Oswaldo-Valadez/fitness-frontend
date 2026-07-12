import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import RecipeDetailPage from './RecipeDetailPage'
import { server } from '@/test/server'
import { ToastProvider } from '@/components/ui/toast'
import type { Recipe } from '@/api/generated/model'

const recipeFixture: Recipe = {
  id: 1,
  name: 'Ensalada de espinaca',
  description: 'Con hierro y calcio.',
  instructions: null,
  yield_weight_g: 400,
  default_servings: 2,
  serving_name: 'porción',
  serving_weight_g: 200,
  is_favorite: false,
  is_archived: false,
  calculation_version: 2,
  calculated_at: '2026-07-01T00:00:00Z',
  has_incomplete_nutrients: true,
  nutrient_status: { energy_kcal: 'complete', protein_g: 'complete', carbohydrate_g: 'partial', fat_g: 'complete', fiber_g: 'unknown', sodium_mg: 'complete' },
  totals: { energy_kcal: 200, protein_g: 10, carbohydrate_g: 20, fat_g: 5, fiber_g: null, sodium_mg: 300 },
  per_100g: { energy_kcal: 50, protein_g: 2.5, carbohydrate_g: 5, fat_g: 1.25, fiber_g: null, sodium_mg: 75 },
  per_serving: { energy_kcal: 100, protein_g: 5, carbohydrate_g: 10, fat_g: 2.5, fiber_g: null, sodium_mg: 150 },
  limitations: ['Los cálculos incluyen únicamente los alimentos registrados.'],
  ingredients: [
    {
      id: 1,
      food_id: 1,
      food_name: 'Espinaca',
      food_is_available: true,
      quantity_g: 200,
      input_quantity: 200,
      input_unit: 'g',
      portion_description: null,
      per_100g: { energy_kcal: 23 },
      totals: { energy_kcal: 46 },
    },
  ],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/recipes/1']}>
      <ToastProvider>
        <Routes>
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('RecipeDetailPage — nutrient breakdown table', () => {
  it('shows a grouped Por receta / Por 100g / Por porción / Status table', async () => {
    server.use(http.get('/api/recipes/:id', () => HttpResponse.json({ recipe: recipeFixture })))
    renderPage()

    const table = await screen.findByRole('table', { name: /desglose de nutrientes de ensalada de espinaca/i })
    expect(within(table).getByText('Por receta')).toBeInTheDocument()
    expect(within(table).getByText('Por 100 g')).toBeInTheDocument()
    expect(within(table).getByText('Por porción')).toBeInTheDocument()
    expect(within(table).getByText('Estado')).toBeInTheDocument()
    expect(within(table).getAllByText('Energía').length).toBeGreaterThan(0)
    expect(within(table).getByText('Proteína')).toBeInTheDocument()
  })

  it('groups rows by category (Energía / Macronutrientes / Otros)', async () => {
    server.use(http.get('/api/recipes/:id', () => HttpResponse.json({ recipe: recipeFixture })))
    renderPage()

    const table = await screen.findByRole('table', { name: /desglose de nutrientes/i })
    expect(within(table).getByText('Energía', { selector: 'th' })).toBeInTheDocument()
    expect(within(table).getByText('Macronutrientes', { selector: 'th' })).toBeInTheDocument()
    expect(within(table).getByText('Otros', { selector: 'th' })).toBeInTheDocument()
  })

  it('shows an unknown fiber row as "Sin dato", never as 0', async () => {
    server.use(http.get('/api/recipes/:id', () => HttpResponse.json({ recipe: recipeFixture })))
    renderPage()

    const table = await screen.findByRole('table', { name: /desglose de nutrientes/i })
    const fiberRow = within(table).getByText('Fibra').closest('tr')
    expect(fiberRow).toHaveTextContent('Sin dato')
  })

  it('never shows a reference comparison in recipe detail', async () => {
    server.use(http.get('/api/recipes/:id', () => HttpResponse.json({ recipe: recipeFixture })))
    renderPage()

    await screen.findByRole('heading', { name: 'Ensalada de espinaca' })
    for (const banned of [/rda/i, /\bai\b/i, /cdrr/i, /referencia poblacional/i, /por debajo de la referencia/i]) {
      expect(screen.queryByText(banned)).not.toBeInTheDocument()
    }
  })
})
