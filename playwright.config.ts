import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * E2E smoke tests against a real, seeded backend — not mocked. Start both
 * servers yourself before running `npm run test:e2e`:
 *   fitness-backend: php artisan serve
 *   fitness-frontend: npm run dev
 * (or point BASE_URL at any already-running environment). CI only runs this
 * job once a reproducible backend+MySQL setup exists (see .github/workflows/ci.yml).
 *
 * Sprint 5G — globalSetup logs in once per role (demo user, admin) and saves
 * storageState; specs that only need an authenticated session load it
 * instead of calling login() themselves, collapsing 30+ real logins across
 * the full serial suite down to 2. auth-consent.spec.ts runs unauthenticated
 * (its own project) since it legitimately exercises the login mechanism.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  globalSetup: path.join(__dirname, 'e2e/global-setup.ts'),
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      // Real per-test logins: auth mechanism tests, hydration.spec.ts (profile
      // sex_for_equation change + consent revoke/reaccept) and nutrients.spec.ts
      // (profile change + consent revoke/reaccept + its own admin sub-flow) —
      // all three mutate session-level state that can't come from a shared
      // storageState. Kept in one project so the shared 10/min IP throttle
      // budget is easy to reason about: 7 (auth-consent) + 1 (hydration) +
      // 2 (nutrients) = 10 real logins for this whole project, well clear of
      // the other projects' zero real logins (storageState only).
      name: 'auth',
      testMatch: /auth-consent\.spec\.ts|hydration\.spec\.ts|nutrients\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'user',
      testIgnore: /auth-consent\.spec\.ts|admin\.spec\.ts|hydration\.spec\.ts|nutrients\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: path.join(__dirname, 'e2e/.auth/user.json') },
    },
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: path.join(__dirname, 'e2e/.auth/admin.json') },
    },
  ],
})
