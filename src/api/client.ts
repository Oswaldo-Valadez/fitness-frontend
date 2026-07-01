import axios from 'axios'

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

// Interceptor: si 419 (CSRF expirado) reintenta una vez tras renovar cookie
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _csrfRetry?: boolean }

    if (error.response?.status === 419 && !original._csrfRetry) {
      original._csrfRetry = true
      await initCsrf()
      return api(original)
    }

    return Promise.reject(error)
  },
)

export default api
