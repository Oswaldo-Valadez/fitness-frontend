import api from '@/api/client'
import type { Consent } from '@/types/models'

export const accountApi = {
  async exportData(): Promise<void> {
    // Descarga el JSON directamente usando una respuesta blob
    const response = await api.get('/account/export', { responseType: 'blob' })
    const url = URL.createObjectURL(response.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitness-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  async getConsents(): Promise<Consent[]> {
    const { data } = await api.get<{ consents: Consent[] }>('/user')
    return data.consents ?? []
  },

  async revokeConsent(consentId: number): Promise<void> {
    await api.post(`/account/consents/${consentId}/revoke`)
  },

  async deleteAccount(password: string): Promise<void> {
    await api.delete('/account', { data: { current_password: password } })
  },
}
