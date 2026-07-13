import { getHydration } from '@/api/generated/hydration/hydration'
import type {
  GetDailyHydrationSummaryParams,
  GetHydrationPeriodSummaryParams,
  HydrationDailyResponse,
  HydrationEntry,
  HydrationEntryListResponse,
  HydrationPeriodResponse,
  ListHydrationEntriesParams,
  StoreHydrationEntryRequest,
  UpdateHydrationEntryRequest,
} from '@/api/generated/model'

/**
 * Thin adapter over the generated Orval client. The backend owns hydration
 * status/coverage semantics, the AI reference and all copy — this file never
 * re-implements or re-interprets them. No DTOs beyond the generated types.
 */
export const hydrationApi = {
  async listEntries(params?: ListHydrationEntriesParams): Promise<HydrationEntryListResponse> {
    return getHydration().listHydrationEntries(params)
  },

  async createEntry(payload: StoreHydrationEntryRequest): Promise<HydrationEntry> {
    return getHydration().createHydrationEntry(payload)
  },

  async updateEntry(id: number, payload: UpdateHydrationEntryRequest): Promise<HydrationEntry> {
    return getHydration().updateHydrationEntry(id, payload)
  },

  async deleteEntry(id: number): Promise<void> {
    await getHydration().deleteHydrationEntry(id)
  },

  async daily(params?: GetDailyHydrationSummaryParams): Promise<HydrationDailyResponse> {
    return getHydration().getDailyHydrationSummary(params)
  },

  async period(params?: GetHydrationPeriodSummaryParams): Promise<HydrationPeriodResponse> {
    return getHydration().getHydrationPeriodSummary(params)
  },
}

export type { HydrationDailyResponse, HydrationEntry, HydrationEntryListResponse, HydrationPeriodResponse }
