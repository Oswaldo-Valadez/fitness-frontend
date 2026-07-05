export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'fitness-app:theme'

export function getStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

export function applyTheme(pref: ThemePreference) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  if (pref !== 'system') root.classList.add(pref)
}

export function setTheme(pref: ThemePreference) {
  window.localStorage.setItem(STORAGE_KEY, pref)
  applyTheme(pref)
}

/** Call once at app boot to avoid a flash of the wrong theme. */
export function initTheme() {
  applyTheme(getStoredTheme())
}
