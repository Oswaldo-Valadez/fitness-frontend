// Matches the codes seeded by the backend's NutrientSeeder (database/seeders/NutrientSeeder.php).
export const NUTRIENT_CODES = {
  energy: 'energy_kcal',
  protein: 'protein_g',
  carbohydrate: 'carbohydrate_g',
  fat: 'fat_g',
  fiber: 'fiber_g',
  sodium: 'sodium_mg',
} as const

/**
 * Structural (not nominal) nutrient row shape — `amount_per_100g` is a
 * decimal-cast backend column, which serializes as a numeric string
 * regardless of what a given OpenAPI schema declares, so this accepts
 * either representation rather than tying callers to one exact `Food` type.
 */
interface NutrientRow {
  code?: string | null
  amount_per_100g?: string | number | null
}

interface FoodWithNutrients {
  nutrients?: NutrientRow[]
}

function findNutrient(food: FoodWithNutrients, code: string) {
  return food.nutrients?.find((n) => n.code === code)
}

/** Amount per 100g for a nutrient code, or null if the food has no such nutrient — never coerced to 0. */
export function nutrientAmountOrNull(food: FoodWithNutrients, code: string): number | null {
  const nutrient = findNutrient(food, code)
  return nutrient ? Number(nutrient.amount_per_100g) : null
}

export interface FoodMacros {
  energy_kcal: number | null
  protein_g: number | null
  carbohydrate_g: number | null
  fat_g: number | null
  fiber_g: number | null
  sodium_mg: number | null
}

/**
 * Convenience bundle of the six standard macros/micros for a food, per 100g.
 * Every field can be `null` when the underlying nutrient is unknown — none
 * of them are coerced to 0, matching the same policy already applied to
 * dashboard/reports totals.
 */
export function getFoodMacros(food: FoodWithNutrients): FoodMacros {
  return {
    energy_kcal: nutrientAmountOrNull(food, NUTRIENT_CODES.energy),
    protein_g: nutrientAmountOrNull(food, NUTRIENT_CODES.protein),
    carbohydrate_g: nutrientAmountOrNull(food, NUTRIENT_CODES.carbohydrate),
    fat_g: nutrientAmountOrNull(food, NUTRIENT_CODES.fat),
    fiber_g: nutrientAmountOrNull(food, NUTRIENT_CODES.fiber),
    sodium_mg: nutrientAmountOrNull(food, NUTRIENT_CODES.sodium),
  }
}
