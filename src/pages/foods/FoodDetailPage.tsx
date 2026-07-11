import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { clsx } from 'clsx'
import { foodsApi } from '@/api/foods'
import { getFoodMacros } from '@/lib/nutrients'
import type { Food, FoodPortion } from '@/api/generated/model'
import NutrientValue from '@/components/nutrition/NutrientValue'
import PageSpinner from '@/components/ui/PageSpinner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/toast'
import PortionFormModal from './PortionFormModal'

const ROW = (label: string, value: React.ReactNode, accentClass?: string) => (
  <div className="flex justify-between border-b border-border py-2 text-sm last:border-0">
    <span className={clsx('text-muted', accentClass && `flex items-center gap-1.5`)}>
      {accentClass && <span className={clsx('h-2 w-2 rounded-full', accentClass)} />}
      {label}
    </span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
)

export default function FoodDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { show } = useToast()
  const [food, setFood] = useState<Food | null>(null)
  const [loading, setLoading] = useState(true)
  const [grams, setGrams] = useState(100)
  const [selectedPortion, setSelectedPortion] = useState<FoodPortion | null>(null)
  const [portionCount, setPortionCount] = useState(1)
  const [togglingFavorite, setTogglingFavorite] = useState(false)
  const [portionFormOpen, setPortionFormOpen] = useState(false)
  const [editingPortion, setEditingPortion] = useState<FoodPortion | null>(null)
  const [deletingPortion, setDeletingPortion] = useState<FoodPortion | null>(null)

  const load = () => {
    if (!id) return
    foodsApi
      .get(Number(id))
      .then(setFood)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [id])

  if (loading) return <PageSpinner />
  if (!food) return <p className="py-20 text-center text-muted">Alimento no encontrado.</p>

  const effectiveGrams = selectedPortion ? (selectedPortion.gram_weight ?? 0) * portionCount : grams
  const factor = effectiveGrams / 100
  const macros = getFoodMacros(food)
  const protein = macros.protein_g !== null ? macros.protein_g * factor : null
  const carbs = macros.carbohydrate_g !== null ? macros.carbohydrate_g * factor : null
  const fat = macros.fat_g !== null ? macros.fat_g * factor : null
  const kcal = macros.energy_kcal !== null ? macros.energy_kcal * factor : null
  const fiber = macros.fiber_g !== null ? macros.fiber_g * factor : null
  const sodium = macros.sodium_mg !== null ? macros.sodium_mg * factor : null

  // Never build a pie slice from an unknown macro — an incomplete chart is
  // more misleading than no chart at all.
  const macroKcal = (
    [
      protein !== null ? { name: 'Proteína', value: protein * 4, color: 'var(--color-protein)' } : null,
      carbs !== null ? { name: 'Carbohidratos', value: carbs * 4, color: 'var(--color-carbs)' } : null,
      fat !== null ? { name: 'Grasa', value: fat * 9, color: 'var(--color-fat)' } : null,
    ] as const
  ).filter((m): m is { name: string; value: number; color: string } => m !== null && m.value > 0)

  const toggleFavorite = async () => {
    const next = !food.is_favorite
    setTogglingFavorite(true)
    try {
      if (next) await foodsApi.favorite(food.id as number)
      else await foodsApi.unfavorite(food.id as number)
      setFood({ ...food, is_favorite: next })
      show({ variant: 'success', message: next ? 'Agregado a favoritos.' : 'Quitado de favoritos.', duration: 2000 })
    } finally {
      setTogglingFavorite(false)
    }
  }

  const goToDiary = () => {
    const params = new URLSearchParams({ food_id: String(food.id) })
    if (selectedPortion) {
      params.set('portion_id', String(selectedPortion.id))
      params.set('quantity', String(portionCount))
    } else {
      params.set('quantity', String(grams))
    }
    navigate(`/diary?${params}`)
  }

  const handlePortionSaved = () => {
    setPortionFormOpen(false)
    setEditingPortion(null)
    load()
    show({ variant: 'success', message: 'Porción guardada.' })
  }

  const handleDeletePortion = async () => {
    if (!deletingPortion) return
    if (selectedPortion?.id === deletingPortion.id) setSelectedPortion(null)
    await foodsApi.deletePortion(deletingPortion.id)
    load()
    show({ variant: 'success', message: 'Porción eliminada.' })
  }

  const ownPortions = food.portions?.filter((p) => p.is_own) ?? []

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" iconLeft={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
          Regresar
        </Button>
        <button
          onClick={toggleFavorite}
          disabled={togglingFavorite}
          aria-label="Marcar como favorito"
          className="cursor-pointer rounded-lg border border-border bg-surface p-2 text-muted hover:text-warning disabled:opacity-50"
        >
          <Star className={clsx('h-4 w-4', food.is_favorite && 'fill-current text-warning')} />
        </button>
      </div>

      <Card elevated>
        <h1 className="mb-1 text-xl font-bold text-foreground">{food.name}</h1>
        {food.category && <span className="text-xs text-muted">{food.category}</span>}

        <div className="mt-4 flex items-center gap-4">
          {macroKcal.length > 0 && (
            <div className="h-24 w-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={macroKcal} dataKey="value" innerRadius={28} outerRadius={44} startAngle={90} endAngle={-270}>
                    {macroKcal.map((m) => (
                      <Cell key={m.name} fill={m.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex-1 space-y-1.5 text-xs">
            <p className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-protein" /> Proteína{' '}
              <NutrientValue value={protein !== null ? Math.round(protein * 4) : null} unit=" kcal" />
            </p>
            <p className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-carbs" /> Carbohidratos{' '}
              <NutrientValue value={carbs !== null ? Math.round(carbs * 4) : null} unit=" kcal" />
            </p>
            <p className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-fat" /> Grasa <NutrientValue value={fat !== null ? Math.round(fat * 9) : null} unit=" kcal" />
            </p>
          </div>
        </div>

        {food.portions && food.portions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedPortion(null)}
              className={clsx(
                'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                !selectedPortion ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
              )}
            >
              Gramos
            </button>
            {food.portions.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPortion(p)
                  setPortionCount(1)
                }}
                className={clsx(
                  'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  selectedPortion?.id === p.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
                )}
              >
                {p.display_label ?? `${p.description} (${p.gram_weight}g)`}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted">Mis porciones</p>
            <button
              type="button"
              onClick={() => {
                setEditingPortion(null)
                setPortionFormOpen(true)
              }}
              className="flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus className="h-3 w-3" /> Agregar porción
            </button>
          </div>
          {ownPortions.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-2.5 py-1.5 text-xs">
              <span className="text-foreground">{p.display_label ?? `${p.description} (${p.gram_weight}g)`}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPortion(p)
                    setPortionFormOpen(true)
                  }}
                  aria-label={`Editar porción ${p.description}`}
                  className="cursor-pointer rounded p-1 text-muted hover:text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingPortion(p)}
                  aria-label={`Eliminar porción ${p.description}`}
                  className="cursor-pointer rounded p-1 text-muted hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-end justify-between gap-3 rounded-lg bg-surface-muted p-3">
          {selectedPortion ? (
            <div className="flex items-end gap-1.5">
              <button
                type="button"
                onClick={() => setPortionCount((c) => Math.max(0.5, c - 0.5))}
                className="flex h-9 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-muted"
                aria-label="Reducir cantidad de porciones"
              >
                −
              </button>
              <label className="flex flex-col items-center">
                <input
                  type="number"
                  value={portionCount}
                  min={0.5}
                  step={0.5}
                  onChange={(e) => setPortionCount(Number(e.target.value) || 0)}
                  className="h-9 w-16 rounded-lg border border-border bg-surface text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Cantidad de porciones"
                />
                <span className="mt-0.5 text-[10px] text-muted">{selectedPortion.unit_label}</span>
              </label>
              <button
                type="button"
                onClick={() => setPortionCount((c) => c + 0.5)}
                className="flex h-9 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-muted"
                aria-label="Aumentar cantidad de porciones"
              >
                +
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-1.5">
              <button
                type="button"
                onClick={() => setGrams((g) => Math.max(10, g - 10))}
                className="flex h-9 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-muted"
                aria-label="Reducir cantidad"
              >
                −
              </button>
              <label className="flex flex-col items-center">
                <input
                  type="number"
                  value={grams}
                  min={1}
                  max={5000}
                  onChange={(e) => setGrams(Number(e.target.value) || 0)}
                  className="h-9 w-16 rounded-lg border border-border bg-surface text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Cantidad en gramos"
                />
                <span className="mt-0.5 text-[10px] text-muted">gramos</span>
              </label>
              <button
                type="button"
                onClick={() => setGrams((g) => Math.min(5000, g + 10))}
                className="flex h-9 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-muted"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
          )}
          <p className="text-lg font-bold text-foreground">
            <NutrientValue value={kcal !== null ? Math.round(kcal) : null} unit=" kcal" />
          </p>
        </div>

        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Información nutricional · {selectedPortion ? `${portionCount} ${selectedPortion.unit_label}` : `${grams}g`}
          </p>
          {ROW('Energía', <NutrientValue value={kcal} decimals={1} unit=" kcal" />)}
          {ROW('Proteína', <NutrientValue value={protein} decimals={2} unit=" g" />, 'bg-protein')}
          {ROW('Carbohidratos', <NutrientValue value={carbs} decimals={2} unit=" g" />, 'bg-carbs')}
          {ROW('Grasa total', <NutrientValue value={fat} decimals={2} unit=" g" />, 'bg-fat')}
          {fiber !== null && ROW('Fibra', <NutrientValue value={fiber} decimals={2} unit=" g" />)}
          {sodium !== null && ROW('Sodio', <NutrientValue value={sodium} decimals={1} unit=" mg" />)}
        </div>

        <Button className="mt-6 w-full" size="lg" onClick={goToDiary}>
          Agregar al diario
        </Button>
      </Card>

      <PortionFormModal
        open={portionFormOpen}
        onClose={() => {
          setPortionFormOpen(false)
          setEditingPortion(null)
        }}
        onSaved={handlePortionSaved}
        foodId={food.id}
        portion={editingPortion}
      />

      <ConfirmDialog
        open={!!deletingPortion}
        onClose={() => setDeletingPortion(null)}
        onConfirm={handleDeletePortion}
        title="Eliminar porción"
        description={`¿Seguro que quieres eliminar "${deletingPortion?.description}"?`}
        confirmLabel="Eliminar"
      />
    </div>
  )
}
