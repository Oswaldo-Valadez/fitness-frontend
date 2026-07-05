import dayjs from 'dayjs'
import { delay, readStore, writeStore } from './mock/localStore'

// TODO(backend): logging streaks aren't computed server-side yet. This module
// derives them client-side from a locally-tracked set of "days with activity".
// Replace with a real endpoint once available, e.g. GET /api/dashboard/streak
// (ideally computed from meal_logs so it doesn't need its own storage).

const STORE_KEY = 'logged-dates'

function seedIfEmpty(): string[] {
  const existing = readStore<string[]>(STORE_KEY, [])
  if (existing.length > 0) return existing
  // Seed a short streak ending yesterday so today's first log continues it.
  const seeded = [3, 2, 1].map((d) => dayjs().subtract(d, 'day').format('YYYY-MM-DD'))
  writeStore(STORE_KEY, seeded)
  return seeded
}

function computeStreaks(dates: string[]) {
  const unique = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a))
  if (unique.length === 0) return { currentStreak: 0, bestStreak: 0, lastLoggedDate: null as string | null }

  let currentStreak = 0
  const today = dayjs().format('YYYY-MM-DD')
  const startsToday = unique[0] === today
  const startsYesterday = unique[0] === dayjs().subtract(1, 'day').format('YYYY-MM-DD')

  if (startsToday || startsYesterday) {
    currentStreak = 1
    for (let i = 1; i < unique.length; i += 1) {
      const expected = dayjs(unique[i - 1])
        .subtract(1, 'day')
        .format('YYYY-MM-DD')
      if (unique[i] === expected) currentStreak += 1
      else break
    }
  }

  let bestStreak = 1
  let running = 1
  for (let i = 1; i < unique.length; i += 1) {
    const expected = dayjs(unique[i - 1])
      .subtract(1, 'day')
      .format('YYYY-MM-DD')
    running = unique[i] === expected ? running + 1 : 1
    bestStreak = Math.max(bestStreak, running)
  }

  return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak), lastLoggedDate: unique[0] }
}

export const streakApi = {
  async get() {
    await delay(150)
    return computeStreaks(seedIfEmpty())
  },

  /** Call after any successful diary write so the streak reflects real usage. */
  async recordActivity(date: string): Promise<void> {
    const all = seedIfEmpty()
    if (!all.includes(date)) writeStore(STORE_KEY, [...all, date])
  },
}
