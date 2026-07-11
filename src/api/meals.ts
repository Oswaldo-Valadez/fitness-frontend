import { getMeals } from '@/api/generated/meals/meals'
import type { MealLog, MealLogItem, MealLogMealType } from '@/api/generated/model'

interface StoreMealPayload {
  meal_type: MealLogMealType
  occurred_at: string
  notes?: string
}

export const mealApi = {
  async list(date: string): Promise<MealLog[]> {
    return getMeals().listMeals({ date })
  },

  async get(id: number): Promise<MealLog> {
    const { meal } = await getMeals().getMeal(id)
    return meal as MealLog
  },

  async create(payload: StoreMealPayload): Promise<MealLog> {
    const { meal } = await getMeals().createMeal(payload)
    return meal as MealLog
  },

  /** Metadata-only edit (name/notes). meal_type/occurred_at moves are handled by copy(). */
  async update(id: number, payload: { name?: string | null; notes?: string | null }): Promise<MealLog> {
    return getMeals().updateMeal(id, payload)
  },

  async destroy(id: number): Promise<void> {
    await getMeals().deleteMeal(id)
  },

  /** Classic grams-only entry. Kept for the dashboard's safe "undo delete". */
  async addItem(mealId: number, payload: { food_id: number; quantity_g: number }): Promise<MealLogItem> {
    const { item } = await getMeals().addMealItem(mealId, payload)
    return item as MealLogItem
  },

  /** Food by grams, or by portion count when portionId is set. */
  async addItemFromFood(mealId: number, payload: { food_id: number; portion_id?: number | null; quantity: number }): Promise<MealLogItem> {
    const { item } = await getMeals().addMealItemFromFood(mealId, payload)
    return item as MealLogItem
  },

  /** Recipe by grams of finished dish, or by number of servings. */
  async addItemFromRecipe(mealId: number, payload: { recipe_id: number; unit: 'grams' | 'servings'; quantity: number }): Promise<MealLogItem> {
    const { item } = await getMeals().addMealItemFromRecipe(mealId, payload)
    return item as MealLogItem
  },

  async updateItem(mealId: number, itemId: number, quantity_g: number): Promise<MealLogItem> {
    return getMeals().updateMealItem(mealId, itemId, { quantity_g })
  },

  async destroyItem(mealId: number, itemId: number): Promise<void> {
    await getMeals().deleteMealItem(mealId, itemId)
  },

  /** Copies a meal to another date. Never assumes the copy keeps identical nutrients — read `warnings`/`differences`. */
  async copy(
    mealId: number,
    payload: { target_date: string; meal_type?: MealLogMealType; keep_name?: boolean; mode?: 'recalculate' | 'snapshot'; idempotency_key?: string },
  ): Promise<{ meal: MealLog; warnings: string[]; differences: string[] }> {
    const { meal, warnings, differences } = await getMeals().copyMeal(mealId, payload)
    return { meal: meal as MealLog, warnings: warnings ?? [], differences: differences ?? [] }
  },
}
