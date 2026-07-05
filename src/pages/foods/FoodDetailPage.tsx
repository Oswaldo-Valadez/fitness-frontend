import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { clsx } from 'clsx'
import { foodsApi } from '@/api/foods'
import { foodPreferencesApi } from '@/api/foodPreferences'
import { getFoodMacros } from '@/lib/nutrients'
import type { Food } from '@/types/models'
import PageSpinner from '@/components/ui/PageSpinner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useToast } from '@/components/ui/toast'

const ROW = (label: string, value: string, accentClass?: string) => (
  <div className="flex justify-between border-b border-border py-2 text-sm last:border-0">
    <span className={clsx('text-muted', accentClass && `flex items-center gap-1.5`)}>
      {accentClass && <span className={clsx('h-2 w-2 rounded-full', accentClass)} />}
      {label}
    </span>
    <span className="tabular-nums font-medium text-foreground">{value}</span>
  </div>
)

export default function FoodDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { show } = useToast()
  const [food, setFood] = useState<Food | null>(null)
  const [loading, setLoading] = useState(true)
  const [grams, setGrams] = useState(100)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (!id) return
    foodsApi
      .get(Number(id))
      .then((f) => {
        setFood(f)
        setIsFavorite(foodPreferencesApi.isFavorite(f.id))
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageSpinner />
  if (!food) return <p className="py-20 text-center text-muted">Alimento no encontrado.</p>

  const factor = grams / 100
  const macros = getFoodMacros(food)
  const protein = macros.protein_g * factor
  const carbs = macros.carbohydrate_g * factor
  const fat = macros.fat_g * factor
  const kcal = macros.energy_kcal * factor
  const fiber = macros.fiber_g !== null ? macros.fiber_g * factor : null
  const sodium = macros.sodium_mg !== null ? macros.sodium_mg * factor : null

  const macroKcal = [
    { name: 'Proteína', value: protein * 4, color: 'var(--color-protein)' },
    { name: 'Carbohidratos', value: carbs * 4, color: 'var(--color-carbs)' },
    { name: 'Grasa', value: fat * 9, color: 'var(--color-fat)' },
  ].filter((m) => m.value > 0)

  const toggleFavorite = async () => {
    const next = await foodPreferencesApi.toggleFavorite(food)
    setIsFavorite(next)
    show({ variant: 'success', message: next ? 'Agregado a favoritos.' : 'Quitado de favoritos.', duration: 2000 })
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" iconLeft={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
          Regresar
        </Button>
        <button
          onClick={toggleFavorite}
          aria-label="Marcar como favorito"
          className="cursor-pointer rounded-lg border border-border bg-surface p-2 text-muted hover:text-warning"
        >
          <Star className={clsx('h-4 w-4', isFavorite && 'fill-current text-warning')} />
        </button>
      </div>

      <Card elevated>
        <h1 className="mb-1 text-xl font-bold text-foreground">{food.name}</h1>
        {food.category && <span className="text-xs text-muted">{food.category}</span>}

        <div className="mt-4 flex items-center gap-4">
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
          <div className="flex-1 space-y-1.5 text-xs">
            <p className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-protein" /> Proteína {Math.round(protein * 4)} kcal
            </p>
            <p className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-carbs" /> Carbohidratos {Math.round(carbs * 4)} kcal
            </p>
            <p className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-fat" /> Grasa {Math.round(fat * 9)} kcal
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3 rounded-lg bg-surface-muted p-3">
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
          <p className="tabular-nums text-lg font-bold text-foreground">{Math.round(kcal)} kcal</p>
        </div>

        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Información nutricional · {grams}g</p>
          {ROW('Energía', `${kcal.toFixed(1)} kcal`)}
          {ROW('Proteína', `${protein.toFixed(2)} g`, 'bg-protein')}
          {ROW('Carbohidratos', `${carbs.toFixed(2)} g`, 'bg-carbs')}
          {ROW('Grasa total', `${fat.toFixed(2)} g`, 'bg-fat')}
          {fiber !== null && ROW('Fibra', `${fiber.toFixed(2)} g`)}
          {sodium !== null && ROW('Sodio', `${sodium.toFixed(1)} mg`)}
        </div>

        <Button className="mt-6 w-full" size="lg" onClick={() => navigate(`/diary?food_id=${food.id}`)}>
          Agregar al diario
        </Button>
      </Card>
    </div>
  )
}
