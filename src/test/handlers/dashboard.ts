import { HttpResponse, http } from 'msw'
import type { DashboardSummary } from '@/api/generated/model'

/** A day with complete, partial, and unknown nutrient coverage across items — exercises all three NutrientValue states. */
export const dashboardSummaryFixture: DashboardSummary = {
  date: '2026-01-15',
  timezone: 'America/Mexico_City',
  target: {
    id: 1,
    user_id: 1,
    calculation_method_id: 1,
    effective_from: '2026-01-01',
    effective_to: null,
    age_years: 30,
    sex_for_equation: 'male',
    height_cm: 175,
    weight_kg: 70,
    activity_level: 'moderate',
    goal: 'maintain',
    bmr_kcal: 1700,
    activity_factor: 1.55,
    tdee_kcal: 2635,
    goal_adjustment_kcal: 0,
    target_kcal: 2635,
    protein_percentage: 25,
    carbohydrate_percentage: 45,
    fat_percentage: 30,
    protein_grams: 165,
    carbohydrate_grams: 296,
    fat_grams: 88,
  },
  meals: [
    {
      id: 1,
      meal_type: 'breakfast',
      name: null,
      occurred_at: '2026-01-15T08:00:00Z',
      notes: null,
      items: [
        {
          id: 1,
          food_name: 'Avena',
          quantity_g: 150,
          energy_kcal: 102,
          protein_g: 3.6,
          carbohydrate_g: 18,
          fat_g: 2.1,
          nutrient_status: { energy_kcal: 'complete' },
        },
        {
          id: 2,
          food_name: 'Alimento con datos parciales',
          quantity_g: 100,
          energy_kcal: 50,
          protein_g: null,
          carbohydrate_g: null,
          fat_g: null,
          nutrient_status: { energy_kcal: 'partial' },
        },
      ],
      totals: { energy_kcal: 152, protein_g: 3.6, carbohydrate_g: 18, fat_g: 2.1 },
    },
  ],
  totals: { energy_kcal: 152, protein_g: 3.6, carbohydrate_g: 18, fat_g: 2.1 },
  nutrient_status: { energy_kcal: 'partial', protein_g: 'complete', carbohydrate_g: 'complete', fat_g: 'complete' },
  has_demo_foods: true,
}

export const dashboardHandlers = [http.get('/api/dashboard', () => HttpResponse.json(dashboardSummaryFixture))]
