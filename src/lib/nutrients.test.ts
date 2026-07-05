import { describe, expect, it } from 'vitest'
import { getFoodMacros, nutrientAmountOrNull } from './nutrients'

describe('getFoodMacros', () => {
  it('returns null (never 0) for every macro the food has no nutrient row for — not just fiber/sodium', () => {
    const foodWithNoNutrients = { nutrients: [] }

    const macros = getFoodMacros(foodWithNoNutrients)

    expect(macros).toEqual({
      energy_kcal: null,
      protein_g: null,
      carbohydrate_g: null,
      fat_g: null,
      fiber_g: null,
      sodium_mg: null,
    })
  })

  it('distinguishes a real declared zero from an unknown nutrient', () => {
    const foodWithZeroFat = {
      nutrients: [
        { code: 'energy_kcal', amount_per_100g: '52' },
        { code: 'fat_g', amount_per_100g: '0' },
      ],
    }

    const macros = getFoodMacros(foodWithZeroFat)

    expect(macros.energy_kcal).toBe(52)
    expect(macros.fat_g).toBe(0)
    expect(macros.protein_g).toBeNull()
    expect(macros.carbohydrate_g).toBeNull()
  })

  it('reads a partial food (only energy known) without coercing the rest to zero', () => {
    const partialFood = { nutrients: [{ code: 'energy_kcal', amount_per_100g: 100 }] }

    const macros = getFoodMacros(partialFood)

    expect(macros.energy_kcal).toBe(100)
    expect(macros.protein_g).toBeNull()
    expect(macros.carbohydrate_g).toBeNull()
    expect(macros.fat_g).toBeNull()
  })
})

describe('nutrientAmountOrNull', () => {
  it('returns null when the food has no nutrients array at all', () => {
    expect(nutrientAmountOrNull({}, 'energy_kcal')).toBeNull()
  })

  it('returns the numeric amount when present, regardless of string/number wire representation', () => {
    expect(nutrientAmountOrNull({ nutrients: [{ code: 'sodium_mg', amount_per_100g: '1.5000' }] }, 'sodium_mg')).toBe(1.5)
  })
})
