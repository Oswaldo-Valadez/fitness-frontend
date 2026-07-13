import { HttpResponse, http } from 'msw'
import type { HydrationDailyResponse, HydrationEntry, HydrationEntryListResponse, HydrationPeriodResponse } from '@/api/generated/model'

export const hydrationEntryFixture: HydrationEntry = {
  id: 1,
  volume_ml: 500,
  occurred_at: '2026-07-05T15:30:00+00:00',
  local_date: '2026-07-05',
  note: null,
}

export const hydrationDailyFixture: HydrationDailyResponse = {
  date: '2026-07-05',
  timezone: 'America/Mexico_City',
  plain_water_logged_ml: 500,
  dietary_water_ml: null,
  estimated_total_water_ml: null,
  status: 'partial',
  comparison: 'indeterminate',
  coverage: { items_total: 0, items_known: 0, items_unknown: 0, coverage_pct: null },
  reference: {
    reference_type: 'AI',
    reference_mode: 'range',
    value: null,
    minimum: 2700,
    maximum: 3700,
    unit: 'ml',
    direction: 'informational',
  },
  entries: [hydrationEntryFixture],
  limitations: ['Este registro no mide tu estado fisiológico de hidratación.'],
  notices: ['Evita registrar la misma agua aquí y como alimento en el diario.'],
}

export const hydrationEntryListFixture: HydrationEntryListResponse = {
  date: '2026-07-05',
  data: [hydrationEntryFixture],
}

export const hydrationPeriodFixture: HydrationPeriodResponse = {
  summary: {
    start_date: '2026-06-06',
    end_date: '2026-07-05',
    timezone: 'America/Mexico_City',
    days_total: 30,
    days_with_plain_water: 2,
    days_complete_coverage: 0,
    average_plain_water_ml: 500,
    average_label: 'Promedio de días con agua registrada',
  },
  daily_points: [
    { date: '2026-07-04', plain_water_logged_ml: 500, dietary_water_ml: null, estimated_total_water_ml: null, status: 'partial' },
    { date: '2026-07-05', plain_water_logged_ml: null, dietary_water_ml: null, estimated_total_water_ml: null, status: 'no_data' },
  ],
  reference: {
    reference_type: 'AI',
    reference_mode: 'range',
    value: null,
    minimum: 2700,
    maximum: 3700,
    unit: 'ml',
    direction: 'informational',
  },
  limitations: ['Este registro no mide tu estado fisiológico de hidratación.'],
  notices: ['Evita registrar la misma agua aquí y como alimento en el diario.'],
}

export const hydrationHandlers = [
  http.get('/api/hydration/daily', () => HttpResponse.json(hydrationDailyFixture)),
  http.get('/api/hydration/entries', () => HttpResponse.json(hydrationEntryListFixture)),
  http.post('/api/hydration/entries', () => HttpResponse.json(hydrationEntryFixture, { status: 201 })),
  http.put('/api/hydration/entries/:id', () => HttpResponse.json(hydrationEntryFixture)),
  http.delete('/api/hydration/entries/:id', () => HttpResponse.json({ message: 'Registro eliminado.' })),
  http.get('/api/hydration/period', () => HttpResponse.json(hydrationPeriodFixture)),
]
