import { getDietQuality } from '@/api/generated/diet-quality/diet-quality'
import type {
  DietQualityAssessment,
  DietQualityAssessmentListResponse,
  DietQualityCheckIn,
  DietQualityGoal,
  DietQualityGoalProgress,
  DietQualityInstrument,
  DietQualitySummary,
  GetDietQualitySummaryPeriod,
  ListDietQualityGoals200,
  Medas14Answers,
  UpsertDietQualityCheckInRequest,
} from '@/api/generated/model'

/**
 * Thin adapter over the generated Orval client. The backend owns scoring,
 * thresholds and copy — this file never re-implements or re-interprets them.
 */
export const dietQualityApi = {
  async instrument(): Promise<DietQualityInstrument> {
    const { instrument } = await getDietQuality().getMedas14Instrument()
    return instrument
  },

  async listAssessments(page = 1): Promise<DietQualityAssessmentListResponse> {
    return getDietQuality().listDietQualityAssessments({ page })
  },

  async latestAssessment(): Promise<DietQualityAssessment | null> {
    const { assessment } = await getDietQuality().getLatestDietQualityAssessment()
    return assessment ?? null
  },

  async createAssessment(instrumentCode: string, instrumentVersion: string, answers: Medas14Answers): Promise<DietQualityAssessment> {
    const { assessment } = await getDietQuality().createDietQualityAssessment({
      instrument_code: instrumentCode,
      instrument_version: instrumentVersion,
      answers,
    })
    return assessment
  },

  async assessment(id: number): Promise<DietQualityAssessment> {
    const { assessment } = await getDietQuality().getDietQualityAssessment(id)
    return assessment
  },

  async deleteAssessment(id: number): Promise<void> {
    await getDietQuality().deleteDietQualityAssessment(id)
  },

  async summary(period: GetDietQualitySummaryPeriod = 90): Promise<DietQualitySummary> {
    return getDietQuality().getDietQualitySummary({ period })
  },

  async goals(): Promise<ListDietQualityGoals200> {
    return getDietQuality().listDietQualityGoals()
  },

  async createGoal(focusCode: string, sourceAssessmentId?: number | null): Promise<DietQualityGoal> {
    const { goal } = await getDietQuality().createDietQualityGoal({
      focus_code: focusCode,
      source_assessment_id: sourceAssessmentId ?? null,
    })
    return goal
  },

  async updateGoalStatus(id: number, status: 'active' | 'paused' | 'completed' | 'archived'): Promise<DietQualityGoal> {
    const { goal } = await getDietQuality().updateDietQualityGoal(id, { status })
    return goal
  },

  async deleteGoal(id: number): Promise<void> {
    await getDietQuality().deleteDietQualityGoal(id)
  },

  async upsertCheckIn(goalId: number, localDate: string, payload: UpsertDietQualityCheckInRequest): Promise<DietQualityCheckIn> {
    const { check_in } = await getDietQuality().upsertDietQualityCheckIn(goalId, localDate, payload)
    return check_in
  },

  async deleteCheckIn(goalId: number, localDate: string): Promise<void> {
    await getDietQuality().deleteDietQualityCheckIn(goalId, localDate)
  },
}

export type { DietQualityAssessment, DietQualityCheckIn, DietQualityGoal, DietQualityGoalProgress, DietQualityInstrument, DietQualitySummary, Medas14Answers }
