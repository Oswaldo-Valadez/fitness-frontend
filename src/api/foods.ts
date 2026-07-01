import api from '@/api/client'
import type { Food, PaginatedResponse } from '@/types/models'

export const foodsApi = {
  async search(query: string, category?: string, page = 1): Promise<PaginatedResponse<Food>> {
    const params = new URLSearchParams({ page: String(page) })
    if (query) params.set('q', query)
    if (category) params.set('category', category)
    const { data } = await api.get<PaginatedResponse<Food>>(`/foods?${params}`)
    return data
  },

  async categories(): Promise<string[]> {
    const { data } = await api.get<{ categories: string[] }>('/foods/categories')
    return data.categories
  },

  async get(id: number): Promise<Food> {
    const { data } = await api.get<{ food: Food }>(`/foods/${id}`)
    return data.food
  },
}
