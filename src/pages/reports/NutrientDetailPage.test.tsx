import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import NutrientDetailPage from './NutrientDetailPage'
import { server } from '@/test/server'
import { nutrientDetailFixture } from '@/test/handlers/nutrients'

function renderPage(code = 'sodium_mg') {
  return render(
    <MemoryRouter initialEntries={[`/reports/nutrients/${code}`]}>
      <Routes>
        <Route path="/reports/nutrients/:code" element={<NutrientDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NutrientDetailPage', () => {
  it('shows name, unit, definition, reference and average', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Sodio' })).toBeInTheDocument()
    expect(screen.getByText(/unidad: mg/i)).toBeInTheDocument()
    expect(screen.getByText(/electrolito presente en muchos alimentos procesados/i)).toBeInTheDocument()
    expect(screen.getByText('Promedio de días registrados')).toBeInTheDocument()
    expect(screen.getAllByText(/2500\s*mg/).length).toBeGreaterThan(0)
  })

  it('shows sodium special-nutrient copy: added salt caveat and "CDRR is not a toxicity limit"', async () => {
    renderPage()

    await screen.findByRole('heading', { name: 'Sodio' })
    expect(screen.getAllByText(/la estimación puede omitir sal agregada al cocinar o en la mesa/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/la cdrr no es un límite de toxicidad/i).length).toBeGreaterThan(0)
  })

  it('never shows a UL anywhere on the detail page', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Sodio' })

    for (const banned of [/\bUL\b/, /upper intake level/i, /nivel máximo tolerable/i]) {
      expect(screen.queryByText(banned)).not.toBeInTheDocument()
    }
  })

  it('renders an accessible table alongside the trend chart, with a gap for the no-data day', async () => {
    renderPage()

    const table = await screen.findByRole('table', { name: /historial diario de sodio/i })
    expect(table).toBeInTheDocument()
    expect(screen.getAllByText('Sin registro').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Parcial').length).toBeGreaterThan(0)
  })

  it('shows the quality breakdown panel ("Origen de los datos"), never a clinical confidence score', async () => {
    renderPage()

    await screen.findByRole('heading', { name: 'Sodio' })
    expect(screen.getByText('Origen de los datos')).toBeInTheDocument()
    expect(screen.getByText('Verificado')).toBeInTheDocument()
    expect(screen.queryByText(/confianza clínica/i)).not.toBeInTheDocument()
  })

  it('shows a range reference without a midpoint for an undisclosed-sex nutrient (iron)', async () => {
    server.use(
      http.get('/api/nutrition/intake/nutrients/:code', () =>
        HttpResponse.json({
          ...nutrientDetailFixture,
          definition: { ...nutrientDetailFixture.definition, code: 'iron_mg', name: 'Hierro', unit: 'mg', description: null },
          reference: {
            nutrient_code: 'iron_mg',
            reference_type: 'RDA',
            reference_mode: 'range',
            value: null,
            minimum: 8,
            maximum: 18,
            unit: 'mg',
            direction: 'at_least',
            is_primary: true,
            sex_basis: 'undisclosed',
            limitations: ['La absorción varía según el alimento y el patrón dietético. Este registro no diagnostica anemia.'],
            source_note: null,
          },
          informational_references: [],
        }),
      ),
    )

    renderPage('iron_mg')

    await screen.findByRole('heading', { name: 'Hierro' })
    expect(screen.getByText(/8–18\s*mg \(RDA\)/)).toBeInTheDocument()
    // Never a midpoint value (13), never attributes an end to a sex.
    expect(screen.queryByText(/^13\s*mg$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/hombres/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/mujeres/i)).not.toBeInTheDocument()
    expect(screen.getByText(/no representa un punto medio/i)).toBeInTheDocument()
    // Iron special copy: no anemia diagnosis.
    expect(screen.getByText(/este registro no diagnostica anemia/i)).toBeInTheDocument()
  })

  it('shows vitamin D special copy about dietary intake vs. sun exposure/blood levels', async () => {
    server.use(
      http.get('/api/nutrition/intake/nutrients/:code', () =>
        HttpResponse.json({
          ...nutrientDetailFixture,
          definition: { ...nutrientDetailFixture.definition, code: 'vitamin_d_mcg', name: 'Vitamina D', unit: 'mcg', description: null },
        }),
      ),
    )

    renderPage('vitamin_d_mcg')

    await screen.findByRole('heading', { name: 'Vitamina D' })
    expect(screen.getByText(/no representa exposición solar ni concentraciones sanguíneas/i)).toBeInTheDocument()
  })

  it('shows a 404 empty state for an unknown or inactive nutrient code', async () => {
    server.use(http.get('/api/nutrition/intake/nutrients/:code', () => HttpResponse.json({ message: 'Not found' }, { status: 404 })))

    renderPage('not_a_real_code')

    expect(await screen.findByText('Nutriente no disponible')).toBeInTheDocument()
    expect(screen.getByText('Este nutriente no existe o no está activo.')).toBeInTheDocument()
  })

  it('surfaces consent-required state on 409', async () => {
    server.use(
      http.get('/api/nutrition/intake/nutrients/:code', () =>
        HttpResponse.json({ message: 'Debes aceptar los consentimientos vigentes para continuar.', code: 'CONSENT_REQUIRED' }, { status: 409 }),
      ),
    )

    renderPage()

    expect(await screen.findByText('Consentimiento requerido')).toBeInTheDocument()
  })

  it('surfaces a rate-limit message on 429', async () => {
    server.use(http.get('/api/nutrition/intake/nutrients/:code', () => HttpResponse.json({ message: 'Demasiadas solicitudes' }, { status: 429 })))

    renderPage()

    expect(await screen.findByText(/demasiadas solicitudes/i)).toBeInTheDocument()
  })

  it('shows "Referencia no disponible" when the backend returns no reference (no profile context)', async () => {
    server.use(
      http.get('/api/nutrition/intake/nutrients/:code', () => HttpResponse.json({ ...nutrientDetailFixture, reference: null, informational_references: [] })),
    )

    renderPage()

    await screen.findByRole('heading', { name: 'Sodio' })
    expect(screen.getByText('Referencia no disponible')).toBeInTheDocument()
    expect(screen.getByText(/no hay una referencia poblacional disponible/i)).toBeInTheDocument()
  })

  it('filters the trend by period (7/30/90)', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'Sodio' })

    for (const name of ['7 días', '30 días', '90 días']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })
})
