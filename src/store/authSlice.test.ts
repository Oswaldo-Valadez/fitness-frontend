import { describe, expect, it } from 'vitest'
import authReducer, { clearUser, fetchMe, login, logout, register } from './authSlice'

const demoUser = {
  id: 1,
  name: 'Demo User',
  email: 'demo@example.com',
  timezone: 'America/Mexico_City',
  locale: 'es_MX',
  onboarding_completed_at: '2026-01-01T12:00:00Z',
  has_active_consents: true,
  has_profile: true,
}

describe('authSlice', () => {
  it('returns the initial state', () => {
    const state = authReducer(undefined, { type: 'unknown' })

    expect(state).toEqual({
      user: null,
      status: 'idle',
      initialized: false,
    })
  })

  it('handles clearUser', () => {
    const previous = {
      user: demoUser,
      status: 'idle' as const,
      initialized: false,
    }

    const state = authReducer(previous, clearUser())

    expect(state.user).toBeNull()
    expect(state.initialized).toBe(true)
  })

  it('handles fetchMe fulfilled and rejected', () => {
    const fulfilled = authReducer(undefined, fetchMe.fulfilled(demoUser, 'req-1'))
    expect(fulfilled.user).toEqual(demoUser)
    expect(fulfilled.initialized).toBe(true)
    expect(fulfilled.status).toBe('idle')

    const rejected = authReducer(fulfilled, fetchMe.rejected(new Error('401'), 'req-2'))
    expect(rejected.user).toBeNull()
    expect(rejected.initialized).toBe(true)
    expect(rejected.status).toBe('idle')
  })

  it('handles login/register rejected and logout fulfilled', () => {
    const loginRejected = authReducer(undefined, login.rejected(new Error('bad creds'), 'req-3', {
      email: 'bad@example.com',
      password: 'bad',
    }))
    expect(loginRejected.status).toBe('failed')

    const registerRejected = authReducer(undefined, register.rejected(new Error('invalid'), 'req-4', {
      name: 'Demo',
      email: 'demo@example.com',
      password: 'secret123',
      password_confirmation: 'secret123',
    }))
    expect(registerRejected.status).toBe('failed')

    const loggedState = authReducer(undefined, login.fulfilled(demoUser, 'req-5', {
      email: 'demo@example.com',
      password: 'secret123',
    }))

    const afterLogout = authReducer(loggedState, logout.fulfilled(undefined, 'req-6'))
    expect(afterLogout.user).toBeNull()
    expect(afterLogout.initialized).toBe(true)
  })
})