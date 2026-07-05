import type { Food } from '@/types/models'
import { getFoodMacros } from '@/lib/nutrients'
import { delay, readStore, writeStore } from './mock/localStore'

// TODO(backend): recent/favorite foods aren't tracked server-side yet.
// Replace with real endpoints once available, e.g.:
//   GET  /api/foods/recent
//   GET  /api/foods/favorites
//   POST /api/foods/{id}/favorite    DELETE /api/foods/{id}/favorite
// Pages call recordUsage()/toggleFavorite()/recent()/favorites() below —
// swapping storage for HTTP calls needs no other changes.

export interface FoodSnapshot {
  id: number
  name: string
  category: string | null
  energy_kcal: number
}

const RECENT_KEY = 'recent-foods'
const FAVORITES_KEY = 'favorite-foods'
const MAX_RECENT = 8

function toSnapshot(food: Food): FoodSnapshot {
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    energy_kcal: getFoodMacros(food).energy_kcal,
  }
}

export const foodPreferencesApi = {
  async recent(limit = 6): Promise<FoodSnapshot[]> {
    await delay(120)
    return readStore<FoodSnapshot[]>(RECENT_KEY, []).slice(0, limit)
  },

  /** Call whenever a food is logged in the diary. */
  recordUsage(food: Food): void {
    const all = readStore<FoodSnapshot[]>(RECENT_KEY, [])
    const next = [toSnapshot(food), ...all.filter((f) => f.id !== food.id)].slice(0, MAX_RECENT)
    writeStore(RECENT_KEY, next)
  },

  async favorites(): Promise<FoodSnapshot[]> {
    await delay(120)
    return readStore<FoodSnapshot[]>(FAVORITES_KEY, [])
  },

  isFavorite(foodId: number): boolean {
    return readStore<FoodSnapshot[]>(FAVORITES_KEY, []).some((f) => f.id === foodId)
  },

  async toggleFavorite(food: Food): Promise<boolean> {
    await delay(150)
    const all = readStore<FoodSnapshot[]>(FAVORITES_KEY, [])
    const exists = all.some((f) => f.id === food.id)
    const next = exists ? all.filter((f) => f.id !== food.id) : [toSnapshot(food), ...all]
    writeStore(FAVORITES_KEY, next)
    return !exists
  },
}
