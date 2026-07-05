import { getAdmin } from '@/api/generated/admin/admin'
import type { UpdateNutrientMappingBodyMappingStatus } from '@/api/generated/model'

export const fdcAdminApi = {
  async status() {
    return getAdmin().fdcStatus()
  },

  async preview(fdcId: number) {
    const { preview } = await getAdmin().fdcPreview({ fdc_id: fdcId })
    return preview
  },

  async import(fdcId: number, options: { update?: boolean; force?: boolean } = {}) {
    const { result } = await getAdmin().fdcImport({ fdc_id: fdcId, ...options })
    return result
  },
}

export const importBatchesApi = {
  async list() {
    return getAdmin().listImportBatches()
  },

  async get(id: number) {
    const { batch } = await getAdmin().getImportBatch(id)
    return batch
  },
}

export const nutrientMappingsApi = {
  async list() {
    return getAdmin().listNutrientMappings()
  },

  async update(id: number, payload: { nutrient_id?: number | null; mapping_status: UpdateNutrientMappingBodyMappingStatus }) {
    const { mapping } = await getAdmin().updateNutrientMapping(id, payload)
    return mapping
  },
}

export const auditEventsApi = {
  async list(eventType?: string) {
    return getAdmin().listAuditEvents({ event_type: eventType })
  },
}
