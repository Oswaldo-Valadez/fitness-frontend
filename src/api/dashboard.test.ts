import { describe, expect, it } from 'vitest'
import { dashboardSummaryFixture } from '@/test/handlers/dashboard'
import { resolveNutrientStatus } from '@/lib/nutrientStatus'
import { dashboardApi } from './dashboard'

describe('dashboardApi.getSummary against a mocked backend', () => {
  it('fetches the summary and preserves partial/complete nutrient status (never coerced to a number)', async () => {
    const summary = await dashboardApi.getSummary('2026-01-15')

    expect(summary).toEqual(dashboardSummaryFixture)
    expect(resolveNutrientStatus(summary.totals?.energy_kcal, summary.nutrient_status?.energy_kcal)).toBe('partial')

    const [completeItem, partialItem] = summary.meals?.[0].items ?? []
    expect(resolveNutrientStatus(completeItem.energy_kcal, completeItem.nutrient_status?.energy_kcal)).toBe('complete')
    expect(resolveNutrientStatus(partialItem.energy_kcal, partialItem.nutrient_status?.energy_kcal)).toBe('partial')
  })
})
