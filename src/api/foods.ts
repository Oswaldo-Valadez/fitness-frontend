import { getFoods } from '@/api/generated/foods/foods'
import type { CreateFoodPortionBody, RecentItemsResponse, UnifiedSearchResponse, UpdateFoodPortionBody } from '@/api/generated/model'

export const foodsApi = {
  /** Paginated catalog browse (Fase 5 "Biblioteca › Alimentos"). */
  async search(query: string, category?: string, page = 1) {
    return getFoods().listFoods({ q: query || undefined, category, page })
  },

  async categories(): Promise<string[]> {
    const { categories } = await getFoods().getFoodCategories()
    return categories
  },

  async get(id: number) {
    const { food } = await getFoods().getFood(id)
    return food
  },

  async favorite(foodId: number): Promise<void> {
    await getFoods().favoriteFood(foodId)
  },

  async unfavorite(foodId: number): Promise<void> {
    await getFoods().unfavoriteFood(foodId)
  },

  async createPortion(foodId: number, payload: CreateFoodPortionBody) {
    const { portion } = await getFoods().createFoodPortion(foodId, payload)
    return portion
  },

  async updatePortion(portionId: number, payload: UpdateFoodPortionBody) {
    const { portion } = await getFoods().updateFoodPortion(portionId, payload)
    return portion
  },

  async deletePortion(portionId: number): Promise<void> {
    await getFoods().deleteFoodPortion(portionId)
  },
}

export const unifiedSearchApi = {
  /** Grouped quick-add search used by the diary: foods / my_foods / recipes. */
  async search(query: string): Promise<UnifiedSearchResponse> {
    return getFoods().unifiedSearch({ q: query })
  },
}

export const recentItemsApi = {
  async list(): Promise<RecentItemsResponse> {
    return getFoods().listRecentItems()
  },
}
