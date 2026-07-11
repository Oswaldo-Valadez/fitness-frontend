import type { Page } from '@playwright/test'

export const DEMO_EMAIL = 'demo@fitness.local'
export const DEMO_PASSWORD = 'Password123!'
export const ADMIN_EMAIL = 'admin@fitness.local'
export const ADMIN_PASSWORD = 'Password123!'

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard/)
}

/**
 * Calls the backend directly through the browser's authenticated session,
 * replicating axios's default XSRF handling (read the `XSRF-TOKEN` cookie,
 * send it back as `X-XSRF-TOKEN`). Runs as an in-page `fetch()` (not
 * Playwright's `page.request`) because Sanctum's stateful-domain check
 * requires `Origin`/`Referer` headers that only a same-page fetch sends
 * automatically — `page.request` doesn't, and gets a false 401.
 * Used only for arranging state the UI has no control for (e.g. revoking a
 * consent — there is no "manage consents" screen by design, see
 * docs/consumer-handoff.md).
 */
export async function apiRequest(page: Page, method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, data?: unknown) {
  return page.evaluate(
    async ({ method, path, data }) => {
      const xsrfCookie = document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))
      const xsrfToken = xsrfCookie ? decodeURIComponent(xsrfCookie.split('=')[1]) : ''

      const response = await fetch(path, {
        method,
        credentials: 'include',
        headers: {
          'X-XSRF-TOKEN': xsrfToken,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: data !== undefined ? JSON.stringify(data) : undefined,
      })

      const text = await response.text()
      let json: unknown = null
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        // non-JSON body (e.g. 204/empty) — leave json as null
      }

      return { ok: response.ok, status: response.status, json }
    },
    { method, path, data },
  )
}
