import api from '@/api/client'
import type { NutritionTarget, UserProfile } from '@/types/models'

/**
 * The backend does not accept a `consents` array — it validates three
 * top-level booleans and looks up document versions itself server-side
 * (config('nutrition.consent_versions')).
 */
export interface ConsentsPayload {
  terms: boolean
  privacy: boolean
  general_wellness_disclaimer: boolean
}

export interface ProfilePayload {
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

export const onboardingApi = {
  async acceptConsents(payload: ConsentsPayload) {
    const { data } = await api.post<{ message: string }>('/onboarding/consents', payload)
    return data
  },

  async saveProfile(payload: ProfilePayload) {
    const { data } = await api.post<{
      message: string
      profile: UserProfile
      active_target: NutritionTarget | null
      target_calculable: boolean
      onboarding_completed_at: string | null
    }>('/onboarding/profile', payload)
    return data
  },
}

export const profileApi = {
  async get() {
    const { data } = await api.get<{ profile: UserProfile | null; active_target: NutritionTarget | null }>('/profile')
    return data
  },

  async update(payload: ProfilePayload) {
    const { data } = await api.put<{
      message: string
      profile: UserProfile
      active_target: NutritionTarget | null
    }>('/profile', payload)
    return data
  },

  async targets(page = 1) {
    const { data } = await api.get<{ data: NutritionTarget[]; meta: { last_page: number } }>(`/profile/targets?page=${page}`)
    return data
  },
}
