import { defineConfig, devices } from '@playwright/test'

/**
 * E2E smoke tests against a real, seeded backend — not mocked. Start both
 * servers yourself before running `npm run test:e2e`:
 *   fitness-backend: php artisan serve
 *   fitness-frontend: npm run dev
 * (or point BASE_URL at any already-running environment). CI only runs this
 * job once a reproducible backend+MySQL setup exists (see .github/workflows/ci.yml).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
