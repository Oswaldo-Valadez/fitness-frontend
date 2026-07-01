import api from '@/api/client'
import type { Food, PaginatedResponse } from '@/types/models'

interface FoodPayload {
  name: string
  category?: string
  food_source_id: number
  energy_kcal_per_100g: number
  protein_g_per_100g: number
  carbohydrate_g_per_100g: number
  fat_g_per_100g: number
  fiber_g_per_100g?: number
  sodium_mg_per_100g?: number
}

export const adminApi = {
  async listFoods(query = '', page = 1): Promise<PaginatedResponse<Food>> {
    const params = new URLSearchParams({ page: String(page) })
    if (query) params.set('q', query)
    const { data } = await api.get<PaginatedResponse<Food>>(`/admin/foods?${params}`)
    return data
  },

  async createFood(payload: FoodPayload): Promise<Food> {
    const { data } = await api.post<{ food: Food }>('/admin/foods', payload)
    return data.food
  },

  async updateFood(id: number, payload: Partial<FoodPayload>): Promise<Food> {
    const { data } = await api.put<{ food: Food }>(`/admin/foods/${id}`, payload)
    return data.food
  },

  async deleteFood(id: number): Promise<void> {
    await api.delete(`/admin/foods/${id}`)
  },

  async importPreview(file: File): Promise<{ rows: unknown[]; errors: unknown[] }> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/admin/foods/import/preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async importCommit(file: File, update = false): Promise<{ imported: number; updated: number; errors: unknown[] }> {
    const form = new FormData()
    form.append('file', file)
    if (update) form.append('update', '1')
    const { data } = await api.post('/admin/foods/import/commit', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async sources(): Promise<Array<{ id: number; name: string }>> {
    const { data } = await api.get<{ sources: Array<{ id: number; name: string }> }>('/admin/foods/sources')
    return data.sources
  },
}
