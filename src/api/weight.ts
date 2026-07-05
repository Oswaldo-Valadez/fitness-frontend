import { getProgress } from '@/api/generated/progress/progress'
import type { BodyWeightLog, CreateWeightLogBody, GetWeightProgress200, UpdateWeightLogBody } from '@/api/generated/model'

export const weightApi = {
  /** Logs and a descriptive trend for the last `days` (backend caps at nutrition.weight.max_trend_days). */
  async progress(days = 30): Promise<GetWeightProgress200> {
    return getProgress().getWeightProgress({ days })
  },

  async log(payload: CreateWeightLogBody): Promise<BodyWeightLog> {
    const { log } = await getProgress().createWeightLog(payload)
    return log as BodyWeightLog
  },

  async update(id: number, payload: UpdateWeightLogBody): Promise<BodyWeightLog> {
    const { log } = await getProgress().updateWeightLog(id, payload)
    return log as BodyWeightLog
  },

  async remove(id: number): Promise<void> {
    await getProgress().deleteWeightLog(id)
  },
}

export type { BodyWeightLog, GetWeightProgress200 as WeightProgress }
