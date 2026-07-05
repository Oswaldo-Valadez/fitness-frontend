import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Clock, Search, Star, X } from 'lucide-react'
import { clsx } from 'clsx'
import { mealApi } from '@/api/meals'
import { foodsApi, recentItemsApi, unifiedSearchApi } from '@/api/foods'
import { recipesApi } from '@/api/recipes'
import { templatesApi } from '@/api/templates'
import type { Food, FoodPortion, MealLog, MealLogItem, MealLogMealType, RecentItemsResponse, Recipe, UnifiedSearchResponse } from '@/api/generated/model'
import { MEAL_LABELS, MEAL_TYPES } from '@/lib/mealTypes'
import { getFoodMacros } from '@/lib/nutrients'
import NutrientValue from '@/components/nutrition/NutrientValue'
import PageSpinner from '@/components/ui/PageSpinner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import DateNav from '@/components/ui/DateNav'
import { useToast } from '@/components/ui/toast'
import MealGroup from '@/pages/dashboard/MealGroup'
import CopyMealModal from './CopyMealModal'

export default function DiaryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { show } = useToast()
  const date = searchParams.get('date') ?? dayjs().format('YYYY-MM-DD')
  const preselectedType = searchParams.get('type') as MealLogMealType | null
  const preselectedFoodId = searchParams.get('food_id')
  const preselectedPortionId = searchParams.get('portion_id')
  const preselectedQuantity = searchParams.get('quantity')
  const preselectedRecipeId = searchParams.get('recipe_id')
  const preselectedUnit = searchParams.get('unit') as 'grams' | 'servings' | null

  const [meals, setMeals] = useState<MealLog[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UnifiedSearchResponse | null>(null)
  const [recent, setRecent] = useState<RecentItemsResponse>({ foods: [], recipes: [] })

  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [selectedPortion, setSelectedPortion] = useState<FoodPortion | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [recipeUnit, setRecipeUnit] = useState<'grams' | 'servings'>('grams')
  const [quantity, setQuantity] = useState(100)
  const [addingItem, setAddingItem] = useState(false)
  const [copyingMealId, setCopyingMealId] = useState<number | null>(null)

  const loadMeals = useCallback(async () => {
    setLoading(true)
    try {
      setMeals(await mealApi.list(date))
    } finally {
      setLoading(false)
    }
  }, [date])

  const loadRecent = useCallback(() => {
    recentItemsApi.list().then(setRecent)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMeals()
  }, [loadMeals])

  useEffect(() => {
    loadRecent()
  }, [loadRecent])

  useEffect(() => {
    if (preselectedFoodId) {
      foodsApi.get(Number(preselectedFoodId)).then((food) => {
        setSelectedFood(food)
        if (preselectedPortionId && food.portions) {
          const portion = food.portions.find((p) => p.id === Number(preselectedPortionId))
          setSelectedPortion(portion ?? null)
        }
        if (preselectedQuantity) setQuantity(Number(preselectedQuantity))
      })
    }
  }, [preselectedFoodId, preselectedPortionId, preselectedQuantity])

  useEffect(() => {
    if (preselectedRecipeId) {
      recipesApi.get(Number(preselectedRecipeId)).then((recipe) => {
        setSelectedRecipe(recipe)
        setRecipeUnit(preselectedUnit ?? 'grams')
        setQuantity(preselectedQuantity ? Number(preselectedQuantity) : (recipe.default_servings ?? 1))
      })
    }
  }, [preselectedRecipeId, preselectedUnit, preselectedQuantity])

  useEffect(() => {
    if (!query) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null)
      return
    }
    const id = setTimeout(async () => {
      setResults(await unifiedSearchApi.search(query))
    }, 300)
    return () => clearTimeout(id)
  }, [query])

  const clearSelection = () => {
    setSelectedFood(null)
    setSelectedPortion(null)
    setSelectedRecipe(null)
    setRecipeUnit('grams')
    setQuantity(100)
    setQuery('')
    setResults(null)
  }

  const pickFood = (food: Food) => {
    setSelectedRecipe(null)
    setSelectedPortion(null)
    setQuantity(100)
    setQuery(food.name ?? '')
    setResults(null)
    // Search/recent results don't embed portions — fetch the detail for those.
    foodsApi.get(food.id as number).then(setSelectedFood)
  }

  const pickRecipe = (recipe: Recipe) => {
    setSelectedFood(null)
    setSelectedPortion(null)
    setRecipeUnit('grams')
    setQuantity(Math.round(recipe.yield_weight_g ?? 100))
    setQuery(recipe.name ?? '')
    setResults(null)
    setSelectedRecipe(recipe)
  }

  const toggleFavorite = async (food: Food) => {
    const nowFavorite = !food.is_favorite
    try {
      if (nowFavorite) await foodsApi.favorite(food.id as number)
      else await foodsApi.unfavorite(food.id as number)
      if (selectedFood?.id === food.id) setSelectedFood({ ...food, is_favorite: nowFavorite })
      loadRecent()
      show({ variant: 'success', message: nowFavorite ? 'Agregado a favoritos.' : 'Quitado de favoritos.', duration: 2000 })
    } catch {
      show({ variant: 'error', message: 'No se pudo actualizar el favorito.' })
    }
  }

  const ensureMeal = async (mealType: MealLogMealType): Promise<MealLog> => {
    const existing = meals.find((m) => m.meal_type === mealType)
    if (existing) return existing
    return mealApi.create({ meal_type: mealType, occurred_at: date })
  }

  const addToMeal = async (mealType: MealLogMealType) => {
    if (!selectedFood && !selectedRecipe) return
    setAddingItem(true)
    try {
      const meal = await ensureMeal(mealType)
      if (selectedFood) {
        await mealApi.addItemFromFood(meal.id as number, {
          food_id: selectedFood.id as number,
          portion_id: selectedPortion?.id ?? null,
          quantity,
        })
      } else if (selectedRecipe) {
        await mealApi.addItemFromRecipe(meal.id as number, {
          recipe_id: selectedRecipe.id as number,
          unit: recipeUnit,
          quantity,
        })
      }
      clearSelection()
      loadRecent()
      await loadMeals()
      show({ variant: 'success', message: `Agregado a ${MEAL_LABELS[mealType].toLowerCase()}.` })
    } finally {
      setAddingItem(false)
    }
  }

  const handleDeleteItem = async (mealId: number, item: MealLogItem) => {
    await mealApi.destroyItem(mealId, item.id as number)
    await loadMeals()
    show({
      variant: 'info',
      message: `${item.food_name} eliminado.`,
      // Solo se ofrece deshacer cuando el item vino de un food_id vigente —
      // un item de receta (food_id null) no se puede reconstruir con el
      // endpoint clásico de "alimento por gramos".
      action:
        typeof item.food_id === 'number'
          ? {
              label: 'Deshacer',
              onClick: async () => {
                await mealApi.addItem(mealId, { food_id: item.food_id as number, quantity_g: item.quantity_g as number })
                loadMeals()
              },
            }
          : undefined,
    })
  }

  const handleSaveAsTemplate = async (mealId: number) => {
    const name = window.prompt('Nombre de la plantilla (opcional):')
    await templatesApi.saveFromMeal(mealId, name || null)
    show({ variant: 'success', message: 'Plantilla guardada.' })
  }

  if (loading) return <PageSpinner />

  const recentQuickPicks = [
    ...(recent.foods ?? []).map((f) => ({ kind: 'food' as const, item: f })),
    ...(recent.recipes ?? []).map((r) => ({ kind: 'recipe' as const, item: r })),
  ].slice(0, 8)

  const effectiveGrams = selectedFood ? (selectedPortion ? (selectedPortion.gram_weight ?? 0) * quantity : quantity) : 0
  const selectedFoodEnergyKcal = selectedFood ? getFoodMacros(selectedFood).energy_kcal : null
  const previewKcal = selectedFood && selectedFoodEnergyKcal !== null ? (selectedFoodEnergyKcal * effectiveGrams) / 100 : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Diario alimenticio</h1>
      </div>

      <DateNav date={date} onChange={(d) => setSearchParams({ date: d })} />

      {/* Panel de agregar alimento */}
      <Card className="space-y-4">
        <h2 className="font-semibold text-foreground">Agregar alimento</h2>

        {recentQuickPicks.length > 0 && !selectedFood && !selectedRecipe && (
          <div className="flex flex-wrap gap-2">
            {recentQuickPicks.map(({ kind, item }) => (
              <button
                key={`${kind}-${item.id}`}
                onClick={() => (kind === 'food' ? pickFood(item as Food) : pickRecipe(item as Recipe))}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5"
              >
                {(item as Food).is_favorite ? <Star className="h-3 w-3 text-warning" fill="currentColor" /> : <Clock className="h-3 w-3 text-muted" />}
                {item.name}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <Input
            id="food-query"
            placeholder="Buscar alimento o receta..."
            iconLeft={<Search className="h-4 w-4" />}
            value={query}
            onChange={(e) => {
              const value = e.target.value
              setQuery(value)
              if (!value) {
                setResults(null)
                setSelectedFood(null)
                setSelectedRecipe(null)
              }
            }}
            role="combobox"
            aria-expanded={!!results}
            aria-controls="food-results-listbox"
            autoComplete="off"
          />
          {results && !selectedFood && !selectedRecipe && (
            <ul
              id="food-results-listbox"
              role="listbox"
              className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-surface shadow-elevated"
            >
              {results.message && <li className="px-4 py-2 text-xs text-muted">{results.message}</li>}
              {results.foods && results.foods.length > 0 && (
                <>
                  <li className="bg-surface-muted px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Alimentos</li>
                  {results.foods.map((f) => (
                    <ResultRow key={`food-${f.id}`} food={f} onPick={() => pickFood(f)} />
                  ))}
                </>
              )}
              {results.my_foods && results.my_foods.length > 0 && (
                <>
                  <li className="bg-surface-muted px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Mis alimentos</li>
                  {results.my_foods.map((f) => (
                    <ResultRow key={`my-food-${f.id}`} food={f} onPick={() => pickFood(f)} />
                  ))}
                </>
              )}
              {results.recipes && results.recipes.length > 0 && (
                <>
                  <li className="bg-surface-muted px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Recetas</li>
                  {results.recipes.map((r) => (
                    <li key={`recipe-${r.id}`} role="option" aria-selected={false}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-surface-muted"
                        onClick={() => pickRecipe(r)}
                      >
                        <span className="text-foreground">{r.name}</span>
                        <span className="tabular-nums text-xs text-muted">{Math.round(r.totals?.energy_kcal ?? 0)} kcal total</span>
                      </button>
                    </li>
                  ))}
                </>
              )}
              {!results.message && !results.foods?.length && !results.my_foods?.length && !results.recipes?.length && (
                <li className="px-4 py-3 text-sm text-muted">Sin resultados.</li>
              )}
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
                  <Star className={clsx('h-4 w-4', selectedFood.is_favorite && 'fill-current text-warning')} />
                </button>
                <button onClick={clearSelection} aria-label="Quitar selección" className="cursor-pointer rounded p-1.5 text-muted hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {selectedFood.portions && selectedFood.portions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPortion(null)
                    setQuantity(100)
                  }}
                  className={clsx(
                    'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    !selectedPortion ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
                  )}
                >
                  Gramos
                </button>
                {selectedFood.portions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPortion(p)
                      setQuantity(1)
                    }}
                    className={clsx(
                      'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      selectedPortion?.id === p.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
                    )}
                  >
                    {p.display_label ?? p.description}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-3">
              <div className="flex items-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(selectedPortion ? 0.5 : 1, q - (selectedPortion ? 0.5 : 10)))}
                  className="flex h-11 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-muted"
                  aria-label="Reducir cantidad"
                >
                  −
                </button>
                <Input
                  id="quantity"
                  label={selectedPortion ? `Cantidad (${selectedPortion.unit_label})` : 'Cantidad (g)'}
                  type="number"
                  min={selectedPortion ? 0.5 : 1}
                  step={selectedPortion ? 0.5 : 1}
                  max={selectedPortion ? undefined : 5000}
                  containerClassName="w-28"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + (selectedPortion ? 0.5 : 10))}
                  className="flex h-11 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-muted"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
              {selectedFood && (
                <div className="pb-2.5 text-sm text-muted">
                  = <NutrientValue value={previewKcal !== null ? Math.round(previewKcal) : null} unit=" kcal" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((type) => (
                <Button key={type} variant={preselectedType === type ? 'primary' : 'secondary'} size="sm" loading={addingItem} onClick={() => addToMeal(type)}>
                  + {MEAL_LABELS[type]}
                </Button>
              ))}
            </div>
          </div>
        )}

        {selectedRecipe && (
          <div className="space-y-3 rounded-xl bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">{selectedRecipe.name}</p>
              <button onClick={clearSelection} aria-label="Quitar selección" className="cursor-pointer rounded p-1.5 text-muted hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRecipeUnit('grams')
                  setQuantity(Math.round(selectedRecipe.yield_weight_g ?? 100))
                }}
                className={clsx(
                  'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  recipeUnit === 'grams' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
                )}
              >
                Gramos
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecipeUnit('servings')
                  setQuantity(selectedRecipe.default_servings ?? 1)
                }}
                className={clsx(
                  'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  recipeUnit === 'servings' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
                )}
              >
                Porciones
              </button>
            </div>

            <div className="flex items-end gap-3">
              <Input
                id="recipe-quantity"
                label={recipeUnit === 'grams' ? 'Cantidad (g)' : 'Número de porciones'}
                type="number"
                min={0.1}
                step={recipeUnit === 'grams' ? 1 : 0.5}
                containerClassName="w-32"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            {selectedRecipe.limitations && selectedRecipe.limitations.length > 0 && (
              <p className="text-xs italic text-muted">{selectedRecipe.limitations[0]}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((type) => (
                <Button key={type} variant={preselectedType === type ? 'primary' : 'secondary'} size="sm" loading={addingItem} onClick={() => addToMeal(type)}>
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
            onDeleteItem={(item) => handleDeleteItem(meal.id as number, item as MealLogItem)}
            onSaveAsTemplate={() => handleSaveAsTemplate(meal.id as number)}
            onCopyToDate={() => setCopyingMealId(meal.id as number)}
          />
        )
      })}

      {meals.length === 0 && <p className="py-10 text-center text-muted">Sin comidas registradas para esta fecha.</p>}

      <CopyMealModal mealId={copyingMealId} onClose={() => setCopyingMealId(null)} onCopied={loadMeals} />
    </div>
  )
}

function ResultRow({ food, onPick }: { food: Food; onPick: () => void }) {
  return (
    <li role="option" aria-selected={false}>
      <button type="button" className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-surface-muted" onClick={onPick}>
        <span className="flex items-center gap-1.5 text-foreground">
          {food.is_favorite && <Star className="h-3 w-3 shrink-0 fill-current text-warning" />}
          {food.name}
        </span>
        <span className="text-xs text-muted">
          <NutrientValue value={getFoodMacros(food).energy_kcal} unit=" kcal/100g" />
        </span>
      </button>
    </li>
  )
}
