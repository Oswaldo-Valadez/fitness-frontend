import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { isConsentRequiredError, normalizeApiError } from './errors'

function axiosErrorWith(status: number, data: unknown, headers: Record<string, string> = {}): AxiosError {
  return new AxiosError('Request failed', String(status), undefined, undefined, {
    status,
    statusText: '',
    data,
    headers,
    config: { headers: new AxiosHeaders() },
  } as never)
}

describe('normalizeApiError', () => {
  it('maps network errors (no response) to kind network', () => {
    const error = new AxiosError('Network Error')
    expect(normalizeApiError(error)).toEqual({
      kind: 'network',
      message: 'No fue posible conectar con el servidor. Revisa tu conexión.',
    })
  })

  it('maps 401 to unauthenticated', () => {
    const error = axiosErrorWith(401, { message: 'Unauthenticated.' })
    expect(normalizeApiError(error)).toEqual({ kind: 'unauthenticated', message: 'Unauthenticated.' })
  })

  it('maps 409 + CONSENT_REQUIRED to consent_required', () => {
    const error = axiosErrorWith(409, { message: 'Debes aceptar los consentimientos.', code: 'CONSENT_REQUIRED' })
    const normalized = normalizeApiError(error)
    expect(normalized.kind).toBe('consent_required')
    expect(isConsentRequiredError(error)).toBe(true)
  })

  it('does not treat a plain 409 as consent_required', () => {
    const error = axiosErrorWith(409, { message: 'Duplicado.' })
    expect(normalizeApiError(error).kind).toBe('unknown')
    expect(isConsentRequiredError(error)).toBe(false)
  })

  it('maps 422 to validation with field errors', () => {
    const error = axiosErrorWith(422, { message: 'Validación', errors: { email: ['Requerido'] } })
    expect(normalizeApiError(error)).toEqual({
      kind: 'validation',
      message: 'Validación',
      errors: { email: ['Requerido'] },
    })
  })

  it('maps 429 to rate_limited and reads retry-after', () => {
    const error = axiosErrorWith(429, { message: 'Too many' }, { 'retry-after': '12' })
    expect(normalizeApiError(error)).toEqual({
      kind: 'rate_limited',
      message: 'Too many',
      retryAfterSeconds: 12,
    })
  })

  it('maps unmapped statuses to unknown, preserving status', () => {
    const error = axiosErrorWith(500, { message: 'Server error' })
    expect(normalizeApiError(error)).toEqual({ kind: 'unknown', message: 'Server error', status: 500 })
  })

  it('falls back to a generic message for non-axios errors', () => {
    expect(normalizeApiError(new Error('boom'))).toEqual({
      kind: 'unknown',
      message: 'Ocurrió un error inesperado. Intenta de nuevo.',
      status: null,
    })
  })
})
