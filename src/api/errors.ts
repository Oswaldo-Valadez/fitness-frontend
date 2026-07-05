import { isAxiosError } from 'axios'

export type ApiError =
  | { kind: 'unauthenticated'; message: string }
  | { kind: 'consent_required'; message: string }
  | { kind: 'validation'; message: string; errors: Record<string, string[]> }
  | { kind: 'rate_limited'; message: string; retryAfterSeconds: number | null }
  | { kind: 'not_found'; message: string }
  | { kind: 'forbidden'; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'unknown'; message: string; status: number | null }

const FALLBACK_MESSAGE = 'Ocurrió un error inesperado. Intenta de nuevo.'

/** Turns any thrown value from an API call into a typed, UI-friendly shape. */
export function normalizeApiError(error: unknown): ApiError {
  if (!isAxiosError(error)) {
    return { kind: 'unknown', message: FALLBACK_MESSAGE, status: null }
  }

  if (!error.response) {
    return { kind: 'network', message: 'No fue posible conectar con el servidor. Revisa tu conexión.' }
  }

  const { status, data } = error.response
  const body = (data ?? {}) as { message?: string; code?: string; errors?: Record<string, string[]> }
  const message = body.message ?? FALLBACK_MESSAGE

  if (status === 401) {
    return { kind: 'unauthenticated', message }
  }

  if (status === 403) {
    return { kind: 'forbidden', message }
  }

  if (status === 404) {
    return { kind: 'not_found', message }
  }

  if (status === 409 && body.code === 'CONSENT_REQUIRED') {
    return { kind: 'consent_required', message }
  }

  if (status === 422) {
    return { kind: 'validation', message, errors: body.errors ?? {} }
  }

  if (status === 429) {
    const retryAfterHeader = error.response.headers?.['retry-after']
    const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : null
    return {
      kind: 'rate_limited',
      message: message === FALLBACK_MESSAGE ? 'Demasiadas solicitudes; espera un momento.' : message,
      retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : null,
    }
  }

  return { kind: 'unknown', message, status }
}

export function isConsentRequiredError(error: unknown): boolean {
  return normalizeApiError(error).kind === 'consent_required'
}
