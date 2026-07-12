import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { dashboardApi } from '@/api/dashboard'
import type { DashboardSummary } from '@/api/generated/model'
import { mealApi } from '@/api/meals'
import { resolveNutrientStatus } from '@/lib/nutrientStatus'
import DateNav from '@/components/ui/DateNav'
import Card from '@/components/ui/Card'
import Skeleton, { SkeletonCard } from '@/components/ui/Skeleton'
import ProgressRing from '@/components/ui/ProgressRing'
import NutrientValue from '@/components/nutrition/NutrientValue'
import { useToast } from '@/components/ui/toast'
import WeightTrendCard from '@/components/weight/WeightTrendCard'
import DietQualityCard from './DietQualityCard'
import MicronutrientsCard from './MicronutrientsCard'
import MacroBar from './MacroBar'
import MealGroup, { type MealGroupItem } from './MealGroup'

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { show } = useToast()

  const dateParam = searchParams.get('date') ?? dayjs().format('YYYY-MM-DD')
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (date: string) => {
    setLoading(true)
    try {
      setSummary(await dashboardApi.getSummary(date))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(dateParam)
  }, [dateParam, load])

  const handleDeleteItem = async (mealId: number, item: MealGroupItem) => {
    await mealApi.destroyItem(mealId, item.id as number)
    await load(dateParam)
    // El resumen del dashboard no incluye food_id/recipe_id (ver
    // DashboardController) ni el snapshot histórico completo, así que no hay
    // forma segura de reconstruir el item aquí. Deshacer con datos
    // incompletos podría restaurar el food/cantidad equivocados — mejor no
    // ofrecerlo que ofrecerlo mal. El diario (Fase 4) sí lo permite porque
    // ahí se cuenta con el food_id vigente.
    show({ variant: 'info', message: `${item.food_name} eliminado.` })
  }

  if (loading || !summary) {
    return (
      <div className="space-y-6">
        <Skeleton className="mx-auto h-6 w-48" />
        <SkeletonCard className="h-56" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-32" />
        </div>
      </div>
    )
  }

  const { totals, target, meals = [], nutrient_status, has_demo_foods } = summary
  const energyStatus = resolveNutrientStatus(totals?.energy_kcal, nutrient_status?.energy_kcal)
  const energyKnown = energyStatus !== 'unknown' && totals?.energy_kcal != null
  const consumedKcal = energyKnown ? Math.round(totals!.energy_kcal!) : null
  const targetKcal = target?.target_kcal ? Number(target.target_kcal) : 0
  const remaining = targetKcal && consumedKcal !== null ? Math.max(0, Math.round(targetKcal - consumedKcal)) : null
  const ringValue = targetKcal && consumedKcal !== null ? (consumedKcal / targetKcal) * 100 : 0
  const overTarget = targetKcal > 0 && consumedKcal !== null && consumedKcal > targetKcal

  return (
    <div className="space-y-6">
      <DateNav date={dateParam} onChange={(d) => setSearchParams({ date: d })} showWeekStrip />

      {has_demo_foods && (
        <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-muted">
          Algunos alimentos de tu registro son datos de demostración y no reflejan productos reales.
        </p>
      )}

      {/* Resumen calórico */}
      <Card elevated className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        <ProgressRing value={ringValue} size={168} strokeWidth={14} progressClassName={overTarget ? 'text-destructive' : 'text-primary'}>
          <div className="text-center">
            <p className="tabular-nums text-3xl font-bold text-foreground">{consumedKcal !== null ? consumedKcal : <NutrientValue value={null} />}</p>
            <p className="text-xs text-muted">de {targetKcal ? Math.round(targetKcal) : '—'} kcal</p>
          </div>
        </ProgressRing>

        <div className="w-full flex-1 space-y-4">
          {remaining !== null && (
            <p className="text-sm text-muted">
              {overTarget ? (
                <span className="font-medium text-destructive">{Math.round(consumedKcal! - targetKcal)} kcal por encima de tu meta</span>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{remaining} kcal</span> restantes hoy
                </>
              )}
            </p>
          )}
          {consumedKcal === null && targetKcal > 0 && (
            <p className="text-sm italic text-muted">Energía consumida desconocida hoy — faltan datos nutricionales.</p>
          )}
          {target && (
            <div className="space-y-3">
              <MacroBar
                label="Proteína"
                consumed={totals?.protein_g ?? null}
                status={nutrient_status?.protein_g}
                target={Number(target.protein_grams)}
                color="protein"
              />
              <MacroBar
                label="Carbohidratos"
                consumed={totals?.carbohydrate_g ?? null}
                status={nutrient_status?.carbohydrate_g}
                target={Number(target.carbohydrate_grams)}
                color="carbs"
              />
              <MacroBar label="Grasa" consumed={totals?.fat_g ?? null} status={nutrient_status?.fat_g} target={Number(target.fat_grams)} color="fat" />
            </div>
          )}
        </div>
      </Card>

      <WeightTrendCard />

      <DietQualityCard />

      <MicronutrientsCard />

      {/* Comidas del día */}
      <div className="space-y-4">
        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
          const meal = meals.find((m) => m.meal_type === type)
          return (
            <MealGroup
              key={type}
              mealType={type}
              meal={meal ?? null}
              onAddMeal={() => navigate(`/diary?date=${dateParam}&type=${type}`)}
              onDeleteItem={meal ? (item) => handleDeleteItem(meal.id!, item) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
