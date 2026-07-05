import api from '@/api/client'
import type { NutritionTarget, UserProfile } from '@/types/models'

export interface ConsentPayload {
  type: 'terms' | 'privacy' | 'general_wellness_disclaimer'
  document_version: string
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
  async acceptConsents(consents: ConsentPayload[]) {
    const { data } = await api.post<{ message: string }>('/onboarding/consents', { consents })
    return data
  },

  async saveProfile(payload: ProfilePayload) {
    const { data } = await api.post<{
      profile: UserProfile
      target: NutritionTarget | null
      target_calculable: boolean
    }>('/onboarding/profile', payload)
    return data
  },
}

export const profileApi = {
  async get() {
    const { data } = await api.get<{ profile: UserProfile | null }>('/profile')
    return data
  },

  async update(payload: ProfilePayload) {
    const { data } = await api.put<{
      profile: UserProfile
      target: NutritionTarget | null
      target_calculable: boolean
    }>('/profile', payload)
    return data
  },

  async targets(page = 1) {
    const { data } = await api.get<{ data: NutritionTarget[]; meta: { last_page: number } }>(`/profile/targets?page=${page}`)
    return data
  },
}
