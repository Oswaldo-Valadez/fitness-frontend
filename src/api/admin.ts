import api from '@/api/client'
import type { Food, PaginatedResponse } from '@/types/models'

interface FoodPayload {
  name: string
  category?: string
  food_source_id: number
  data_type: 'generic' | 'branded' | 'manual'
  energy_kcal?: number
  protein_g?: number
  carbohydrate_g?: number
  fat_g?: number
  fiber_g?: number
  sodium_mg?: number
}

export interface FoodSource {
  id: number
  name: string
  version: string | null
  source_url: string | null
  license_name: string | null
  license_url: string | null
}

export interface ImportSummary {
  total: number
  valid: number
  invalid: number
  inserted: number
  updated: number
  skipped: number
}

export const adminApi = {
  async listFoods(query = '', page = 1): Promise<PaginatedResponse<Food>> {
    const params = new URLSearchParams({ page: String(page) })
    if (query) params.set('q', query)
    const { data } = await api.get<PaginatedResponse<Food>>(`/admin/foods?${params}`)
    return data
  },

  async createFood(payload: FoodPayload): Promise<Food> {
    // Backend returns the created Food object directly (no wrapper key).
    const { data } = await api.post<Food>('/admin/foods', payload)
    return data
  },

  async updateFood(id: number, payload: Partial<FoodPayload>): Promise<Food> {
    const { data } = await api.put<Food>(`/admin/foods/${id}`, payload)
    return data
  },

  async deleteFood(id: number): Promise<void> {
    await api.delete(`/admin/foods/${id}`)
  },

  async importPreview(file: File, sourceId: number): Promise<{ summary: ImportSummary; errors: Record<string, string> }> {
    const form = new FormData()
    form.append('file', file)
    form.append('source_id', String(sourceId))
    const { data } = await api.post('/admin/foods/import/preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async importCommit(
    file: File,
    sourceId: number,
    updateExisting = false,
  ): Promise<{ message: string; summary: ImportSummary; errors: Record<string, string> }> {
    const form = new FormData()
    form.append('file', file)
    form.append('source_id', String(sourceId))
    if (updateExisting) form.append('update_existing', '1')
    const { data } = await api.post('/admin/foods/import/commit', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async sources(): Promise<FoodSource[]> {
    // Backend returns the FoodSource collection directly (no wrapper key).
    const { data } = await api.get<FoodSource[]>('/admin/food-sources')
    return data
  },
}
