import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * Shared MSW server for component/integration tests. Individual tests can
 * layer extra handlers via `server.use(...)` for scenario-specific responses
 * (e.g. a 409 CONSENT_REQUIRED) without touching these defaults.
 */
export const server = setupServer(...handlers)
