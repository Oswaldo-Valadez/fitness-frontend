import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { mealApi } from '@/api/meals'
import { foodsApi } from '@/api/foods'
import type { MealLog, Food } from '@/types/models'
import PageSpinner from '@/components/ui/PageSpinner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Comida',
  dinner: 'Cena',
  snack: 'Snack',
}

export default function DiaryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const date = searchParams.get('date') ?? dayjs().format('YYYY-MM-DD')
  const preselectedType = searchParams.get('type') as MealLog['meal_type'] | null
  const preselectedFoodId = searchParams.get('food_id')

  const [meals, setMeals] = useState<MealLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMeal, setActiveMeal] = useState<MealLog | null>(null)

  // Food search state
  const [foodQuery, setFoodQuery] = useState('')
  const [foodResults, setFoodResults] = useState<Food[]>([])
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [quantity, setQuantity] = useState(100)
  const [addingItem, setAddingItem] = useState(false)

  const loadMeals = useCallback(async () => {
    setLoading(true)
    try {
      setMeals(await mealApi.list(date))
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { loadMeals() }, [loadMeals])

  // Pre-select food from food detail page
  useEffect(() => {
    if (preselectedFoodId) {
      foodsApi.get(Number(preselectedFoodId)).then(setSelectedFood)
    }
  }, [preselectedFoodId])

  // Food search debounce
  useEffect(() => {
    if (!foodQuery) { setFoodResults([]); return }
    const id = setTimeout(async () => {
      const res = await foodsApi.search(foodQuery)
      setFoodResults(res.data)
    }, 300)
    return () => clearTimeout(id)
  }, [foodQuery])

  const createMealAndAdd = async (mealType: MealLog['meal_type']) => {
    if (!selectedFood) return
    setAddingItem(true)
    try {
      let meal = meals.find((m) => m.meal_type === mealType)
      if (!meal) {
        meal = await mealApi.create({ meal_type: mealType, occurred_at: date })
      }
      await mealApi.addItem(meal.id, { food_id: selectedFood.id, quantity_g: quantity })
      setSelectedFood(null)
      setFoodQuery('')
      setFoodResults([])
      setQuantity(100)
      await loadMeals()
    } finally {
      setAddingItem(false)
    }
  }

  const deleteItem = async (mealId: number, itemId: number) => {
    await mealApi.destroyItem(mealId, itemId)
    loadMeals()
  }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Diario alimenticio</h1>
        <input type="date" value={date}
          onChange={(e) => setSearchParams({ date: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Panel de agregar alimento */}
      <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800">Agregar alimento</h2>

        <div className="relative">
          <Input id="food-query" placeholder="Buscar alimento..."
            value={foodQuery} onChange={(e) => setFoodQuery(e.target.value)} />
          {foodResults.length > 0 && !selectedFood && (
            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {foodResults.map((f) => (
                <li key={f.id}>
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-emerald-50 transition-colors"
                    onClick={() => { setSelectedFood(f); setFoodQuery(f.name); setFoodResults([]) }}
                  >
                    {f.name}
                    <span className="ml-2 text-xs text-gray-400">{Number(f.energy_kcal_per_100g).toFixed(0)} kcal/100g</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedFood && (
          <div className="rounded-lg bg-emerald-50 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="font-medium text-emerald-800">{selectedFood.name}</p>
              <button onClick={() => { setSelectedFood(null); setFoodQuery('') }}
                className="text-xs text-gray-400 hover:text-red-500">✕</button>
            </div>
            <div className="flex items-end gap-3">
              <Input id="quantity" label="Cantidad (g)" type="number" min={1} max={5000}
                value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
              <div className="text-sm text-gray-500 pb-2">
                = {((Number(selectedFood.energy_kcal_per_100g) * quantity) / 100).toFixed(0)} kcal
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                <Button key={type} variant={preselectedType === type ? 'primary' : 'secondary'}
                  loading={addingItem} onClick={() => createMealAndAdd(type)}>
                  + {MEAL_LABELS[type]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de comidas del día */}
      {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
        const meal = meals.find((m) => m.meal_type === type)
        if (!meal) return null
        return (
          <div key={type} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">{MEAL_LABELS[type]}</h3>
              <span className="text-sm text-gray-500">
                {(meal.items ?? []).reduce((s, i) => s + Number(i.energy_kcal), 0).toFixed(0)} kcal
              </span>
            </div>
            <ul className="space-y-2">
              {(meal.items ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.food_name} <span className="text-gray-400">{item.quantity_g}g</span></span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{Number(item.energy_kcal).toFixed(0)} kcal</span>
                    <button onClick={() => deleteItem(meal.id, item.id)}
                      className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      {meals.length === 0 && (
        <p className="text-center text-gray-400 py-10">Sin comidas registradas para esta fecha.</p>
      )}
    </div>
  )
}
