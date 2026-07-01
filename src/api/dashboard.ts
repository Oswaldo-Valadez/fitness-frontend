import api from '@/api/client'
import type { MealLog } from '@/types/models'

interface DailySummary {
  date: string
  meals: MealLog[]
  totals: {
    energy_kcal: number
    protein_g: number
    carbohydrate_g: number
    fat_g: number
  }
  target: {
    target_kcal: string | null
    protein_grams: string | null
    carbohydrate_grams: string | null
    fat_grams: string | null
  } | null
}

export const dashboardApi = {
  async getSummary(date: string): Promise<DailySummary> {
    const { data } = await api.get<DailySummary>(`/dashboard?date=${date}`)
    return data
  },
}

export type { DailySummary }
