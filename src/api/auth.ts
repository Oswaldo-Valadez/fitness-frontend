import api, { initCsrf } from '@/api/client'
import type { User } from '@/types/models'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export const authApi = {
  async getCsrf() {
    await initCsrf()
  },

  async login(payload: LoginPayload) {
    await initCsrf()
    const { data } = await api.post<{ user: User; message: string }>('/auth/login', payload)
    return data
  },

  async register(payload: RegisterPayload) {
    await initCsrf()
    const { data } = await api.post<{ user: User; message: string }>('/auth/register', payload)
    return data
  },

  async logout() {
    const { data } = await api.post<{ message: string }>('/auth/logout')
    return data
  },

  async forgotPassword(payload: ForgotPasswordPayload) {
    await initCsrf()
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', payload)
    return data
  },

  async resetPassword(payload: ResetPasswordPayload) {
    await initCsrf()
    const { data } = await api.post<{ message: string }>('/auth/reset-password', payload)
    return data
  },

  async me() {
    const { data } = await api.get<User & {
      has_profile: boolean
      has_active_consents: boolean
      onboarding_completed_at: string | null
    }>('/user')
    return data
  },
}
