import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiEvents } from './apiEvents'
import api from './client'

describe('api client', () => {
  let mock: MockAdapter
  // initCsrf() intentionally bypasses the `api` instance (it must not be
  // prefixed with baseURL /api), so it needs its own mock target.
  let globalMock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(api)
    globalMock = new MockAdapter(axios)
  })

  afterEach(() => {
    mock.restore()
    globalMock.restore()
  })

  it('uses /api as baseURL with credentials enabled', () => {
    expect(api.defaults.baseURL).toBe('/api')
    expect(api.defaults.withCredentials).toBe(true)
  })

  it('retries a 419 exactly once after renewing the CSRF cookie', async () => {
    const csrfSpy = vi.fn().mockReturnValue([204])
    globalMock.onGet('/sanctum/csrf-cookie').reply(() => csrfSpy())

    let attempts = 0
    mock.onGet('/profile').reply(() => {
      attempts += 1
      return attempts === 1 ? [419, { message: 'CSRF expired' }] : [200, { profile: null }]
    })

    const response = await api.get('/profile')

    expect(response.status).toBe(200)
    expect(attempts).toBe(2)
    expect(csrfSpy).toHaveBeenCalledTimes(1)
  })

  it('does not retry infinitely when the CSRF cookie renewal keeps returning 419', async () => {
    globalMock.onGet('/sanctum/csrf-cookie').reply(204)
    mock.onGet('/profile').reply(419, { message: 'CSRF expired' })

    await expect(api.get('/profile')).rejects.toMatchObject({ response: { status: 419 } })
  })

  it('emits session-expired on 401', async () => {
    const listener = vi.fn()
    const unsubscribe = apiEvents.on('session-expired', listener)

    mock.onGet('/dashboard').reply(401, { message: 'Unauthenticated.' })

    await expect(api.get('/dashboard')).rejects.toMatchObject({ response: { status: 401 } })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
  })

  it('emits consent-required on 409 with code CONSENT_REQUIRED', async () => {
    const listener = vi.fn()
    const unsubscribe = apiEvents.on('consent-required', listener)

    mock.onPost('/profile').reply(409, {
      message: 'Debes aceptar los consentimientos vigentes para continuar.',
      code: 'CONSENT_REQUIRED',
    })

    await expect(api.post('/profile', {})).rejects.toMatchObject({ response: { status: 409 } })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0].detail).toMatchObject({
      message: 'Debes aceptar los consentimientos vigentes para continuar.',
    })

    unsubscribe()
  })

  it('does not emit consent-required for a 409 without the CONSENT_REQUIRED code', async () => {
    const listener = vi.fn()
    const unsubscribe = apiEvents.on('consent-required', listener)

    mock.onPost('/meals/1/copy').reply(409, { message: 'Operación duplicada.' })

    await expect(api.post('/meals/1/copy', {})).rejects.toMatchObject({ response: { status: 409 } })
    expect(listener).not.toHaveBeenCalled()

    unsubscribe()
  })

  it('rejects with the 429 response intact so callers can read retry-after', async () => {
    mock.onGet('/search').reply(429, { message: 'Too many requests' }, { 'retry-after': '5' })

    await expect(api.get('/search')).rejects.toMatchObject({
      response: { status: 429, headers: { 'retry-after': '5' } },
    })
  })

  it('normalizes boolean GET params to "1"/"0" (Laravel\'s boolean rule rejects the words true/false)', async () => {
    mock.onGet('/reports/nutrition').reply((config) => {
      expect(config.params).toEqual({ period: 7, include_weight: '0' })
      return [200, {}]
    })

    await api.get('/reports/nutrition', { params: { period: 7, include_weight: false } })
  })
})
