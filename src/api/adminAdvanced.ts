import { getAdmin } from '@/api/generated/admin/admin'
import type {
  DataAuditEvent,
  ExternalNutrientMapping,
  FdcImportSummary,
  FdcStatus,
  FoodImportBatch,
  UpdateNutrientMappingBodyMappingStatus,
} from '@/api/generated/model'

/** Laravel's native paginator shape (not this app's usual {data, meta}) — these three admin endpoints were never migrated to the custom wrapper. */
interface LaravelPage<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export const fdcAdminApi = {
  async status(): Promise<FdcStatus> {
    return getAdmin().fdcStatus()
  },

  async preview(fdcId: number): Promise<FdcImportSummary> {
    const { preview } = await getAdmin().fdcPreview({ fdc_id: fdcId })
    return preview as FdcImportSummary
  },

  async import(fdcId: number, options: { update?: boolean; force?: boolean } = {}): Promise<FdcImportSummary> {
    const { result } = await getAdmin().fdcImport({ fdc_id: fdcId, ...options })
    return result as FdcImportSummary
  },
}

export const importBatchesApi = {
  async list(): Promise<LaravelPage<FoodImportBatch>> {
    return (await getAdmin().listImportBatches()) as unknown as LaravelPage<FoodImportBatch>
  },

  async get(id: number): Promise<FoodImportBatch> {
    const { batch } = await getAdmin().getImportBatch(id)
    return batch as FoodImportBatch
  },
}

export const nutrientMappingsApi = {
  async list(): Promise<LaravelPage<ExternalNutrientMapping>> {
    return (await getAdmin().listNutrientMappings()) as unknown as LaravelPage<ExternalNutrientMapping>
  },

  async update(id: number, payload: { nutrient_id?: number | null; mapping_status: UpdateNutrientMappingBodyMappingStatus }): Promise<ExternalNutrientMapping> {
    const { mapping } = await getAdmin().updateNutrientMapping(id, payload)
    return mapping as ExternalNutrientMapping
  },
}

export const auditEventsApi = {
  async list(eventType?: string): Promise<LaravelPage<DataAuditEvent>> {
    return (await getAdmin().listAuditEvents({ event_type: eventType })) as unknown as LaravelPage<DataAuditEvent>
  },
}
