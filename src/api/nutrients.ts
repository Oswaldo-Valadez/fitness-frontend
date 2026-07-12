import { getNutrients } from '@/api/generated/nutrients/nutrients'
import type {
  DailyNutrientIntakeResponse,
  GetDailyNutrientIntakeParams,
  GetNutrientIntakeDetailParams,
  GetNutritionReferencesParams,
  GetPeriodNutrientIntakeParams,
  NutrientDefinition,
  NutrientDetailResponse,
  NutrientReferenceResponse,
  PeriodNutrientIntakeResponse,
} from '@/api/generated/model'

/**
 * Thin adapter over the generated Orval client. The backend owns nutrient
 * definitions, reference resolution, status/coverage semantics and copy —
 * this file never re-implements or re-interprets them.
 */
export const nutrientsApi = {
  async list(): Promise<NutrientDefinition[]> {
    const { data } = await getNutrients().listNutrients()
    return data
  },

  async references(params?: GetNutritionReferencesParams): Promise<NutrientReferenceResponse> {
    return getNutrients().getNutritionReferences(params)
  },

  async dailyIntake(params?: GetDailyNutrientIntakeParams): Promise<DailyNutrientIntakeResponse> {
    return getNutrients().getDailyNutrientIntake(params)
  },

  async periodIntake(params?: GetPeriodNutrientIntakeParams): Promise<PeriodNutrientIntakeResponse> {
    return getNutrients().getPeriodNutrientIntake(params)
  },

  async detail(code: string, params?: GetNutrientIntakeDetailParams): Promise<NutrientDetailResponse> {
    return getNutrients().getNutrientIntakeDetail(code, params)
  },
}

export type { DailyNutrientIntakeResponse, NutrientDefinition, NutrientDetailResponse, NutrientReferenceResponse, PeriodNutrientIntakeResponse }
