import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

// Individual test files that need raw HTTP mocking (axios-mock-adapter) run
// their own adapter directly against the `api` instance and don't hit this
// server; MSW here backs component/integration tests that render pages.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
