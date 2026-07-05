import type { Food } from '@/types/models'

// Matches the codes seeded by the backend's NutrientSeeder (database/seeders/NutrientSeeder.php).
export const NUTRIENT_CODES = {
  energy: 'energy_kcal',
  protein: 'protein_g',
  carbohydrate: 'carbohydrate_g',
  fat: 'fat_g',
  fiber: 'fiber_g',
  sodium: 'sodium_mg',
} as const

function findNutrient(food: Pick<Food, 'nutrients'>, code: string) {
  return food.nutrients?.find((n) => n.code === code)
}

/** Amount per 100g for a nutrient code, or 0 if the food has no such nutrient. */
export function nutrientAmount(food: Pick<Food, 'nutrients'>, code: string): number {
  const nutrient = findNutrient(food, code)
  return nutrient ? Number(nutrient.amount_per_100g) : 0
}

/** Like nutrientAmount, but null (instead of 0) when absent — for optional facts like fiber/sodium. */
export function nutrientAmountOrNull(food: Pick<Food, 'nutrients'>, code: string): number | null {
  const nutrient = findNutrient(food, code)
  return nutrient ? Number(nutrient.amount_per_100g) : null
}

export interface FoodMacros {
  energy_kcal: number
  protein_g: number
  carbohydrate_g: number
  fat_g: number
  fiber_g: number | null
  sodium_mg: number | null
}

/** Convenience bundle of the six standard macros/micros for a food, per 100g. */
export function getFoodMacros(food: Pick<Food, 'nutrients'>): FoodMacros {
  return {
    energy_kcal: nutrientAmount(food, NUTRIENT_CODES.energy),
    protein_g: nutrientAmount(food, NUTRIENT_CODES.protein),
    carbohydrate_g: nutrientAmount(food, NUTRIENT_CODES.carbohydrate),
    fat_g: nutrientAmount(food, NUTRIENT_CODES.fat),
    fiber_g: nutrientAmountOrNull(food, NUTRIENT_CODES.fiber),
    sodium_mg: nutrientAmountOrNull(food, NUTRIENT_CODES.sodium),
  }
}
