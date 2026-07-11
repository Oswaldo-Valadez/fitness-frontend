import api from '@/api/client'
import { getAccount } from '@/api/generated/account/account'

export const accountApi = {
  async exportData(): Promise<void> {
    // Blob download: the generated client always decodes JSON via the
    // shared mutator, so this one call stays on the raw axios instance
    // with an explicit responseType, per the documented adapter exception.
    const response = await api.get('/account/export', { responseType: 'blob' })
    const url = URL.createObjectURL(response.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitness-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  // No endpoint lists individual consents (`/user` only exposes the
  // aggregate `has_active_consents` boolean) — do not invent one.
  // Revocation flows through `/account/consents/{id}/revoke` below.
  async revokeConsent(consentId: number): Promise<void> {
    await getAccount().revokeConsent(consentId)
  },

  // Required consent types are always granted together during onboarding
  // (see ConsentsStep), and the frontend never learns individual consent
  // IDs, so revocation is symmetric: revoke all active consents in one call.
  async revokeAllConsents(): Promise<void> {
    await getAccount().revokeAllConsents()
  },

  async deleteAccount(password: string): Promise<void> {
    await getAccount().deleteAccount({ current_password: password })
  },
}
