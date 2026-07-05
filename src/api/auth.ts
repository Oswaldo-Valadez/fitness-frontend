import { initCsrf } from '@/api/client'
import { getAuth } from '@/api/generated/auth/auth'
import type { AuthForgotPasswordBody, AuthLoginBody, AuthRegisterBody, AuthResetPasswordBody } from '@/api/generated/model'

export type LoginPayload = AuthLoginBody
export type RegisterPayload = AuthRegisterBody
export type ForgotPasswordPayload = AuthForgotPasswordBody
export type ResetPasswordPayload = AuthResetPasswordBody

export const authApi = {
  async getCsrf() {
    await initCsrf()
  },

  async login(payload: LoginPayload) {
    await initCsrf()
    return getAuth().authLogin(payload)
  },

  async register(payload: RegisterPayload) {
    await initCsrf()
    return getAuth().authRegister(payload)
  },

  async logout() {
    return getAuth().authLogout()
  },

  async forgotPassword(payload: ForgotPasswordPayload) {
    await initCsrf()
    return getAuth().authForgotPassword(payload)
  },

  async resetPassword(payload: ResetPasswordPayload) {
    await initCsrf()
    return getAuth().authResetPassword(payload)
  },

  async me() {
    return getAuth().getAuthUser()
  },
}
