import { getAdmin } from '@/api/generated/admin/admin'
import type { AdminCreateFoodBody, AdminUpdateFoodBody } from '@/api/generated/model'

export type { Food, FoodSource, FoodImportSummary as ImportSummary } from '@/api/generated/model'

type FoodPayload = AdminCreateFoodBody

export const adminApi = {
  async listFoods(query = '', page = 1) {
    return getAdmin().adminListFoods({ q: query || undefined, page })
  },

  async createFood(payload: FoodPayload) {
    return getAdmin().adminCreateFood(payload)
  },

  async updateFood(id: number, payload: AdminUpdateFoodBody) {
    return getAdmin().adminUpdateFood(id, payload)
  },

  async deleteFood(id: number): Promise<void> {
    await getAdmin().adminDeleteFood(id)
  },

  async importPreview(file: File, sourceId: number) {
    return getAdmin().adminImportFoodsPreview({ file, source_id: sourceId })
  },

  async importCommit(file: File, sourceId: number, updateExisting = false) {
    return getAdmin().adminImportFoodsCommit({ file, source_id: sourceId, update_existing: updateExisting })
  },

  async sources() {
    return getAdmin().adminListFoodSources()
  },
}
