import { configureStore } from '@reduxjs/toolkit'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/server'
import { demoUser } from '@/test/handlers/auth'
import authReducer, { fetchMe, login } from './authSlice'

/**
 * Unlike authSlice.test.ts (pure reducer logic with synthetic actions), this
 * exercises the real thunk -> axios -> MSW round trip, catching mismatches
 * between what authApi expects and what the backend actually returns.
 */
describe('authSlice thunks against a mocked API', () => {
  const buildStore = () => configureStore({ reducer: { auth: authReducer } })

  it('fetchMe hydrates the store from a real /api/user response', async () => {
    const store = buildStore()
    await store.dispatch(fetchMe())

    expect(store.getState().auth.user).toEqual(demoUser)
    expect(store.getState().auth.initialized).toBe(true)
  })

  it('fetchMe rejection (401) leaves the user unauthenticated without throwing', async () => {
    server.use(http.get('/api/user', () => HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })))

    const store = buildStore()
    await store.dispatch(fetchMe())

    expect(store.getState().auth.user).toBeNull()
    expect(store.getState().auth.initialized).toBe(true)
  })

  it('login sets the user from the response', async () => {
    const store = buildStore()
    await store.dispatch(login({ email: demoUser.email as string, password: 'Password123!' }))

    expect(store.getState().auth.user).toEqual(demoUser)
    expect(store.getState().auth.status).toBe('idle')
  })
})
