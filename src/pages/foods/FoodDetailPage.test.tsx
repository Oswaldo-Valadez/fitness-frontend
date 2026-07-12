import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import FoodDetailPage from './FoodDetailPage'
import { server } from '@/test/server'
import { ToastProvider } from '@/components/ui/toast'
import type { Food } from '@/api/generated/model'

const foodFixture: Food = {
  id: 1,
  name: 'Yogur natural',
  category: 'Lácteos',
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
      amount_per_100g: 60,
      unit: 'kcal',
      data_origin: 'external_import',
      quality_status: 'source_reported',
      source_reference: '208',
      is_estimated: false,
    },
    {
      code: 'protein_g',
      name: 'Proteína',
      amount_per_100g: 10,
      unit: 'g',
      data_origin: 'external_import',
      quality_status: 'source_reported',
      source_reference: '203',
      is_estimated: false,
    },
    {
      code: 'carbohydrate_g',
      name: 'Carbohidratos',
      amount_per_100g: 4,
      unit: 'g',
      data_origin: 'external_import',
      quality_status: 'source_reported',
      source_reference: '205',
      is_estimated: false,
    },
    {
      code: 'fat_g',
      name: 'Grasas totales',
      amount_per_100g: 0.5,
      unit: 'g',
      data_origin: 'external_import',
      quality_status: 'source_reported',
      source_reference: '204',
      is_estimated: false,
    },
    // Real zero — must render as "0", never as "Sin dato".
    {
      code: 'iron_mg',
      name: 'Hierro',
      amount_per_100g: 0,
      unit: 'mg',
      data_origin: 'external_import',
      quality_status: 'verified',
      source_reference: '303',
      is_estimated: false,
    },
    {
      code: 'calcium_mg',
      name: 'Calcio',
      amount_per_100g: 120,
      unit: 'mg',
      data_origin: 'user_entered',
      quality_status: 'user_reported',
      source_reference: null,
      is_estimated: false,
    },
    // vitamin_d_mcg / zinc_mg / etc. intentionally absent -> unknown, never coerced to 0.
  ],
  portions: [],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/foods/1']}>
      <ToastProvider>
        <Routes>
          <Route path="/foods/:id" element={<FoodDetailPage />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('FoodDetailPage — micronutrient sections', () => {
  it('separates Macronutrientes y energía / Fibra y sodio / Vitaminas / Minerales, per 100g', async () => {
    server.use(http.get('/api/foods/:id', () => HttpResponse.json({ food: foodFixture })))
    renderPage()

    expect(await screen.findByText('Macronutrientes y energía · por 100 g')).toBeInTheDocument()
    expect(screen.getByText('Fibra y sodio · por 100 g')).toBeInTheDocument()
    expect(screen.getByText('Vitaminas · por 100 g')).toBeInTheDocument()
    expect(screen.getByText('Minerales · por 100 g')).toBeInTheDocument()
  })

  it('shows a real zero as "0", not as "Sin dato"', async () => {
    server.use(http.get('/api/foods/:id', () => HttpResponse.json({ food: foodFixture })))
    renderPage()

    await screen.findByText('Minerales · por 100 g')
    const ironRow = screen.getByText('Hierro').closest('div')
    expect(ironRow).toHaveTextContent('0')
    expect(ironRow).not.toHaveTextContent('Sin dato')
  })

  it('shows an absent tracked nutrient as "Sin dato", never filled in as zero', async () => {
    server.use(http.get('/api/foods/:id', () => HttpResponse.json({ food: foodFixture })))
    renderPage()

    await screen.findByText('Vitaminas · por 100 g')
    // vitamin_d_mcg has no row on this food -> renders as unknown.
    expect(screen.getAllByText('Sin dato').length).toBeGreaterThan(0)
  })

  it('shows a per-row quality-status label for provenance', async () => {
    server.use(http.get('/api/foods/:id', () => HttpResponse.json({ food: foodFixture })))
    renderPage()

    await screen.findByText('Minerales · por 100 g')
    expect(screen.getByText('Capturado por el usuario')).toBeInTheDocument()
  })
})
