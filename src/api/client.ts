import axios from 'axios'
import { apiEvents } from './apiEvents'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Sanctum SPA cookie auth
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

/**
 * Obtiene el CSRF cookie de Sanctum antes de mutaciones.
 * Solo hace la petición si no hay cookie xsrf-token ya presente.
 */
export async function initCsrf(): Promise<void> {
  await axios.get('/sanctum/csrf-cookie', { withCredentials: true })
}

// Laravel's `boolean` validation rule only accepts true/false/0/1/'0'/'1' —
// NOT the serialized words "true"/"false" that a query-string boolean
// becomes by default. Normalize every GET param boolean to '1'/'0' so any
// `sometimes|boolean` query param (e.g. reports' include_weight) validates
// regardless of which endpoint added it later.
api.interceptors.request.use((config) => {
  if (config.params && typeof config.params === 'object') {
    for (const [key, value] of Object.entries(config.params)) {
      if (typeof value === 'boolean') {
        config.params[key] = value ? '1' : '0'
      }
    }
  }
  return config
})

// Interceptor: si 419 (CSRF expirado) reintenta una vez tras renovar cookie;
// 401 y 409 CONSENT_REQUIRED se difunden como eventos para que el shell de la
// app reaccione (sesión expirada / banner de consentimiento) sin que cada
// llamada individual tenga que conocer esa lógica.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _csrfRetry?: boolean }
    const status = error.response?.status

    if (status === 419 && original && !original._csrfRetry) {
      original._csrfRetry = true
      await initCsrf()
      return api(original)
    }

    if (status === 401) {
      apiEvents.emit('session-expired')
    }

    if (status === 409 && error.response?.data?.code === 'CONSENT_REQUIRED') {
      apiEvents.emit('consent-required', {
        message: error.response.data?.message ?? '',
        returnPath: `${window.location.pathname}${window.location.search}`,
      })
    }

    return Promise.reject(error)
  },
)

export default api
