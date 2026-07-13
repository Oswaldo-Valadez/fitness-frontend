import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { type FullConfig, chromium } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_EMAIL, DEMO_PASSWORD } from './helpers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const USER_STORAGE_STATE = path.join(__dirname, '.auth', 'user.json')
export const ADMIN_STORAGE_STATE = path.join(__dirname, '.auth', 'admin.json')

/**
 * Sprint 5G — logs in ONCE per role and persists the authenticated session to
 * disk. Every spec that only needs to browse as an already-authenticated
 * user/admin loads this storageState instead of calling login() itself.
 *
 * This is the actual fix for the login-throttle cascade (documented since
 * Sprint 3/4): the auth endpoint is rate-limited to 10/min/IP in ALL
 * environments including E2E (never weakened for tests), and a full serial
 * run across 8+ spec files previously performed 30+ real logins. Reusing two
 * sessions collapses that to exactly 2 real logins for the whole suite,
 * leaving auth-consent.spec.ts — which legitimately exercises the login/
 * logout/password-change mechanism itself and cannot reuse a session — as
 * the only file still logging in for real, comfortably under the limit on
 * its own.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5173'
  const browser = await chromium.launch()

  const userPage = await browser.newPage({ baseURL })
  await userPage.goto('/login')
  await userPage.fill('input[type="email"]', DEMO_EMAIL)
  await userPage.fill('input[type="password"]', DEMO_PASSWORD)
  await userPage.click('button[type="submit"]')
  await userPage.waitForURL(/\/dashboard/)
  await userPage.context().storageState({ path: USER_STORAGE_STATE })
  await userPage.close()

  const adminPage = await browser.newPage({ baseURL })
  await adminPage.goto('/login')
  await adminPage.fill('input[type="email"]', ADMIN_EMAIL)
  await adminPage.fill('input[type="password"]', ADMIN_PASSWORD)
  await adminPage.click('button[type="submit"]')
  await adminPage.waitForURL(/\/dashboard/)
  await adminPage.context().storageState({ path: ADMIN_STORAGE_STATE })
  await adminPage.close()

  await browser.close()
}
