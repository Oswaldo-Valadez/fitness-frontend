import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Clock, Search, Star, X } from 'lucide-react'
import { clsx } from 'clsx'
import { mealApi } from '@/api/meals'
import { foodsApi } from '@/api/foods'
import { type FoodSnapshot, foodPreferencesApi } from '@/api/foodPreferences'
import { streakApi } from '@/api/streaks'
import type { Food, MealLog, MealLogItem } from '@/types/models'
import { MEAL_LABELS, MEAL_TYPES } from '@/lib/mealTypes'
import { getFoodMacros } from '@/lib/nutrients'
import PageSpinner from '@/components/ui/PageSpinner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import DateNav from '@/components/ui/DateNav'
import { useToast } from '@/components/ui/toast'
import MealGroup from '@/pages/dashboard/MealGroup'

export default function DiaryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { show } = useToast()
  const date = searchParams.get('date') ?? dayjs().format('YYYY-MM-DD')
  const preselectedType = searchParams.get('type') as MealLog['meal_type'] | null
  const preselectedFoodId = searchParams.get('food_id')

  const [meals, setMeals] = useState<MealLog[]>([])
  const [loading, setLoading] = useState(true)

  const [foodQuery, setFoodQuery] = useState('')
  const [foodResults, setFoodResults] = useState<Food[]>([])
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [quantity, setQuantity] = useState(100)
  const [addingItem, setAddingItem] = useState(false)

  const [recentFoods, setRecentFoods] = useState<FoodSnapshot[]>([])
  const [favoriteFoods, setFavoriteFoods] = useState<FoodSnapshot[]>([])

  const loadMeals = useCallback(async () => {
    setLoading(true)
    try {
      setMeals(await mealApi.list(date))
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMeals()
  }, [loadMeals])

  useEffect(() => {
    foodPreferencesApi.recent().then(setRecentFoods)
    foodPreferencesApi.favorites().then(setFavoriteFoods)
  }, [])

  useEffect(() => {
    if (preselectedFoodId) {
      foodsApi.get(Number(preselectedFoodId)).then(setSelectedFood)
    }
  }, [preselectedFoodId])

  useEffect(() => {
    if (!foodQuery) {
      return
    }
    const id = setTimeout(async () => {
      const res = await foodsApi.search(foodQuery)
      setFoodResults(res.data)
    }, 300)
    return () => clearTimeout(id)
  }, [foodQuery])

  const pickFood = (food: Food | FoodSnapshot) => {
    if ('nutrients' in food) {
      setSelectedFood(food)
    } else {
      foodsApi.get(food.id).then(setSelectedFood)
    }
    setFoodQuery(food.name)
    setFoodResults([])
  }

  const createMealAndAdd = async (mealType: MealLog['meal_type']) => {
    if (!selectedFood) return
    setAddingItem(true)
    try {
      let meal = meals.find((m) => m.meal_type === mealType)
      if (!meal) {
        meal = await mealApi.create({ meal_type: mealType, occurred_at: date })
      }
      await mealApi.addItem(meal.id, { food_id: selectedFood.id, quantity_g: quantity })
      foodPreferencesApi.recordUsage(selectedFood)
      streakApi.recordActivity(date)
      setRecentFoods(await foodPreferencesApi.recent())
      setSelectedFood(null)
      setFoodQuery('')
      setFoodResults([])
      setQuantity(100)
      await loadMeals()
      show({ variant: 'success', message: `Agregado a ${MEAL_LABELS[mealType].toLowerCase()}.` })
    } finally {
      setAddingItem(false)
    }
  }

  const handleDeleteItem = async (mealId: number, item: MealLogItem) => {
    await mealApi.destroyItem(mealId, item.id)
    await loadMeals()
    show({
      variant: 'info',
      message: `${item.food_name} eliminado.`,
      action: {
        label: 'Deshacer',
        onClick: async () => {
          await mealApi.addItem(mealId, { food_id: item.food_id, quantity_g: item.quantity_g })
          loadMeals()
        },
      },
    })
  }

  const toggleFavorite = async (food: Food) => {
    const nowFavorite = await foodPreferencesApi.toggleFavorite(food)
    setFavoriteFoods(await foodPreferencesApi.favorites())
    show({ variant: 'success', message: nowFavorite ? 'Agregado a favoritos.' : 'Quitado de favoritos.', duration: 2000 })
  }

  if (loading) return <PageSpinner />

  const quickPicks = [...favoriteFoods, ...recentFoods.filter((r) => !favoriteFoods.some((f) => f.id === r.id))].slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Diario alimenticio</h1>
      </div>

      <DateNav date={date} onChange={(d) => setSearchParams({ date: d })} />

      {/* Panel de agregar alimento */}
      <Card className="space-y-4">
        <h2 className="font-semibold text-foreground">Agregar alimento</h2>

        {quickPicks.length > 0 && !selectedFood && (
          <div className="flex flex-wrap gap-2">
            {quickPicks.map((f) => {
              const isFav = favoriteFoods.some((fav) => fav.id === f.id)
              return (
                <button
                  key={f.id}
                  onClick={() => pickFood(f)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5"
                >
                  {isFav ? <Star className="h-3 w-3 text-warning" fill="currentColor" /> : <Clock className="h-3 w-3 text-muted" />}
                  {f.name}
                </button>
              )
            })}
          </div>
        )}

        <div className="relative">
          <Input
            id="food-query"
            placeholder="Buscar alimento..."
            iconLeft={<Search className="h-4 w-4" />}
            value={foodQuery}
            onChange={(e) => {
              const value = e.target.value
              setFoodQuery(value)
              if (!value) {
                setFoodResults([])
                setSelectedFood(null)
              }
            }}
            role="combobox"
            aria-expanded={foodResults.length > 0}
            aria-controls="food-results-listbox"
            autoComplete="off"
          />
          {foodResults.length > 0 && !selectedFood && (
            <ul
              id="food-results-listbox"
              role="listbox"
              className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-surface shadow-elevated"
            >
              {foodResults.map((f) => (
                <li key={f.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-surface-muted"
                    onClick={() => pickFood(f)}
                  >
                    <span className="text-foreground">{f.name}</span>
                    <span className="tabular-nums text-xs text-muted">{getFoodMacros(f).energy_kcal.toFixed(0)} kcal/100g</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedFood && (
          <div className="space-y-3 rounded-xl bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">{selectedFood.name}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleFavorite(selectedFood)}
                  aria-label="Marcar como favorito"
                  className="cursor-pointer rounded p-1.5 text-muted hover:text-warning"
                >
                  <Star className={clsx('h-4 w-4', foodPreferencesApi.isFavorite(selectedFood.id) && 'fill-current text-warning')} />
                </button>
                <button
                  onClick={() => {
                    setSelectedFood(null)
                    setFoodQuery('')
                  }}
                  aria-label="Quitar selección"
                  className="cursor-pointer rounded p-1.5 text-muted hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex items-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 10))}
                  className="flex h-11 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-muted"
                  aria-label="Reducir cantidad"
                >
                  −
                </button>
                <Input
                  id="quantity"
                  label="Cantidad (g)"
                  type="number"
                  min={1}
                  max={5000}
                  containerClassName="w-24"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(5000, q + 10))}
                  className="flex h-11 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-muted"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
              <div className="tabular-nums pb-2.5 text-sm text-muted">= {((getFoodMacros(selectedFood).energy_kcal * quantity) / 100).toFixed(0)} kcal</div>
            </div>

            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((type) => (
                <Button
                  key={type}
                  variant={preselectedType === type ? 'primary' : 'secondary'}
                  size="sm"
                  loading={addingItem}
                  onClick={() => createMealAndAdd(type)}
                >
                  + {MEAL_LABELS[type]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Lista de comidas del día */}
      {MEAL_TYPES.map((type) => {
        const meal = meals.find((m) => m.meal_type === type)
        if (!meal) return null
        return (
          <MealGroup
            key={type}
            mealType={type}
            meal={meal}
            onAddMeal={() => setSearchParams({ date, type })}
            onDeleteItem={(item) => handleDeleteItem(meal.id, item)}
          />
        )
      })}

      {meals.length === 0 && <p className="py-10 text-center text-muted">Sin comidas registradas para esta fecha.</p>}
    </div>
  )
}
