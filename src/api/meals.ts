import api from '@/api/client'
import type { MealLog, MealLogItem } from '@/types/models'

interface StoreMealPayload {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  occurred_at: string
  notes?: string
}

interface AddItemPayload {
  food_id: number
  quantity_g: number
}

export const mealApi = {
  async list(date: string): Promise<MealLog[]> {
    // Backend returns the array directly (MealLogController::index), not wrapped in { data }.
    const { data } = await api.get<MealLog[]>(`/meals?date=${date}`)
    return data
  },

  async get(id: number): Promise<MealLog> {
    const { data } = await api.get<{ meal: MealLog }>(`/meals/${id}`)
    return data.meal
  },

  async create(payload: StoreMealPayload): Promise<MealLog> {
    const { data } = await api.post<{ meal: MealLog }>('/meals', payload)
    return data.meal
  },

  async update(id: number, payload: Partial<StoreMealPayload>): Promise<MealLog> {
    const { data } = await api.put<MealLog>(`/meals/${id}`, payload)
    return data
  },

  async destroy(id: number): Promise<void> {
    await api.delete(`/meals/${id}`)
  },

  async addItem(mealId: number, payload: AddItemPayload): Promise<MealLogItem> {
    const { data } = await api.post<{ item: MealLogItem }>(`/meals/${mealId}/items`, payload)
    return data.item
  },

  async updateItem(mealId: number, itemId: number, quantity_g: number): Promise<MealLogItem> {
    const { data } = await api.put<MealLogItem>(`/meals/${mealId}/items/${itemId}`, { quantity_g })
    return data
  },

  async destroyItem(mealId: number, itemId: number): Promise<void> {
    await api.delete(`/meals/${mealId}/items/${itemId}`)
  },
}
