import dayjs from 'dayjs'
import { delay, readStore, writeStore } from './mock/localStore'

// TODO(backend): no weight-history endpoint exists yet. Replace this module's
// internals with real calls once available, e.g.:
//   GET    /api/profile/weight-logs
//   POST   /api/profile/weight-logs        { logged_at, weight_kg }
//   DELETE /api/profile/weight-logs/{id}
// Callers (DashboardPage, ProfilePage) only use the exported functions below,
// so the swap requires no changes outside this file.

export interface WeightEntry {
  id: string
  logged_at: string // YYYY-MM-DD
  weight_kg: number
}

const STORE_KEY = 'weight-logs'

function seedIfEmpty(): WeightEntry[] {
  const existing = readStore<WeightEntry[]>(STORE_KEY, [])
  if (existing.length > 0) return existing

  const seeded: WeightEntry[] = []
  let weight = 79.4
  for (let i = 29; i >= 0; i -= 1) {
    weight += (Math.random() - 0.55) * 0.25
    seeded.push({
      id: crypto.randomUUID(),
      logged_at: dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
      weight_kg: Math.round(weight * 10) / 10,
    })
  }
  writeStore(STORE_KEY, seeded)
  return seeded
}

export const weightApi = {
  async list(): Promise<WeightEntry[]> {
    await delay()
    return seedIfEmpty().sort((a, b) => a.logged_at.localeCompare(b.logged_at))
  },

  async log(entry: { logged_at: string; weight_kg: number }): Promise<WeightEntry> {
    await delay(200)
    const all = seedIfEmpty()
    const existingIndex = all.findIndex((e) => e.logged_at === entry.logged_at)
    const record: WeightEntry = { id: crypto.randomUUID(), ...entry }
    if (existingIndex >= 0) {
      record.id = all[existingIndex].id
      all[existingIndex] = record
    } else {
      all.push(record)
    }
    writeStore(STORE_KEY, all)
    return record
  },

  async remove(id: string): Promise<void> {
    await delay(150)
    const all = seedIfEmpty().filter((e) => e.id !== id)
    writeStore(STORE_KEY, all)
  },
}
