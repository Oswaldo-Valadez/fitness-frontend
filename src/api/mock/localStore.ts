/**
 * Shared helpers for the mock API modules under src/api/*.
 *
 * These modules stand in for backend endpoints that do not exist yet.
 * Each one is written with the same async, error-shaped signature as the
 * real hand-written api/*.ts modules so pages never know the difference —
 * swapping a mock module for a real axios call later is a one-file change.
 */

const PREFIX = 'fitness-app:mock:'

export function readStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStore<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

/** Simulates real network latency so loading states behave like production. */
export function delay(ms = 250): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
