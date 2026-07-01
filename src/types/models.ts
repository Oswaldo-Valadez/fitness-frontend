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
  is_calculable: boolean
}

export interface Food {
  id: number
  name: string
  category: string | null
  barcode: string | null
  energy_kcal_per_100g: string
  protein_g_per_100g: string
  carbohydrate_g_per_100g: string
  fat_g_per_100g: string
  fiber_g_per_100g: string | null
  sodium_mg_per_100g: string | null
}

export interface MealLog {
  id: number
  user_id: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  occurred_at: string
  notes: string | null
  items?: MealLogItem[]
  total_energy_kcal?: number
  total_protein_g?: number
  total_carbohydrate_g?: number
  total_fat_g?: number
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
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}
