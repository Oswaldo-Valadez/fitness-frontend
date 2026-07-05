// Tipos base de los modelos del backend

export interface User {
  id: number
  name: string
  email: string
  timezone: string
  locale: string
  onboarding_completed_at: string | null
  has_profile?: boolean
  has_active_consents?: boolean
}

export interface UserProfile {
  id: number
  user_id: number
  sex_for_equation: 'male' | 'female' | 'undisclosed'
  birth_date: string
  height_cm: number
  weight_kg: number
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal: 'lose_weight' | 'maintain' | 'gain_weight'
  protein_percentage: number
  carbohydrate_percentage: number
  fat_percentage: number
}

// NOTE: `is_calculable` does not exist on the backend model — a target is
// "calculable" precisely when `target_kcal` is non-null. Compute it at the
// call site instead of reading a field that was never really there.
export interface NutritionTarget {
  id: number
  user_id: number
  bmr_kcal: string | null
  tdee_kcal: string | null
  target_kcal: string | null
  protein_grams: string | null
  carbohydrate_grams: string | null
  fat_grams: string | null
  effective_from: string
  effective_to: string | null
}

// Nutrition facts are normalized into a `nutrients` array (one row per
// nutrient code) rather than flat per-100g columns — see src/lib/nutrients.ts
// for helpers that read amounts out of this array by code.
export interface FoodNutrient {
  code: string
  name: string
  amount_per_100g: string
  unit: string
}

export interface Food {
  id: number
  name: string
  category: string | null
  brand: string | null
  data_type: 'generic' | 'branded' | 'manual'
  is_verified: boolean
  is_demo: boolean
  serving_size: string | null
  serving_unit: string | null
  source: string | null
  source_version: string | null
  nutrients: FoodNutrient[]
}

export interface MealLog {
  id: number
  user_id: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  occurred_at: string
  notes: string | null
  items?: MealLogItem[]
}

export interface MealLogItem {
  id: number
  meal_log_id: number
  food_id: number
  food_name: string
  quantity_g: number
  energy_kcal: string
  protein_g: string
  carbohydrate_g: string
  fat_g: string
}

export interface Consent {
  id: number
  type: 'terms' | 'privacy' | 'general_wellness_disclaimer'
  document_version: string
  accepted_at: string
  revoked_at: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
