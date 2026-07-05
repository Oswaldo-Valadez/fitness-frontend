import type { AxiosRequestConfig } from 'axios'
import api from './client'

/**
 * Orval custom instance: every generated function routes through the single
 * configured Axios instance (baseURL, withCredentials, CSRF/401/409/429
 * interceptors), never through a bare `axios.default`.
 */
export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = new AbortController()

  const promise = api({ ...config, signal: source.signal }).then((response) => response.data)

  // Orval's cancellable-query helper expects a `.cancel` method on the promise.
  ;(promise as Promise<T> & { cancel?: () => void }).cancel = () => {
    source.abort('Query was cancelled')
  }

  return promise
}

export default customInstance
