import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Flame } from 'lucide-react'
import { type DailySummary, dashboardApi } from '@/api/dashboard'
import { mealApi } from '@/api/meals'
import { streakApi } from '@/api/streaks'
import type { MealLogItem } from '@/types/models'
import DateNav from '@/components/ui/DateNav'
import Card from '@/components/ui/Card'
import Skeleton, { SkeletonCard } from '@/components/ui/Skeleton'
import ProgressRing from '@/components/ui/ProgressRing'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/components/ui/toast'
import WeightTrendCard from '@/components/weight/WeightTrendCard'
import MacroBar from './MacroBar'
import MealGroup from './MealGroup'

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { show } = useToast()

  const dateParam = searchParams.get('date') ?? dayjs().format('YYYY-MM-DD')
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState<{ currentStreak: number } | null>(null)

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
  useEffect(() => {
    streakApi.get().then(setStreak)
  }, [])

  const handleDeleteItem = async (mealId: number, item: MealLogItem) => {
    await mealApi.destroyItem(mealId, item.id)
    await load(dateParam)
    show({
      variant: 'info',
      message: `${item.food_name} eliminado.`,
      action: {
        label: 'Deshacer',
        onClick: async () => {
          await mealApi.addItem(mealId, { food_id: item.food_id, quantity_g: item.quantity_g })
          load(dateParam)
        },
      },
    })
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

  const { totals, target, meals } = summary
  const targetKcal = target?.target_kcal ? Number(target.target_kcal) : 0
  const consumedKcal = Math.round(totals.energy_kcal)
  const remaining = targetKcal ? Math.max(0, Math.round(targetKcal - consumedKcal)) : null
  const ringValue = targetKcal ? (consumedKcal / targetKcal) * 100 : 0
  const overTarget = targetKcal > 0 && consumedKcal > targetKcal

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <DateNav date={dateParam} onChange={(d) => setSearchParams({ date: d })} showWeekStrip />
        </div>
        {streak && streak.currentStreak > 0 && (
          <Badge variant="warning" size="md" className="shrink-0" title="Días consecutivos registrando comidas">
            <Flame className="h-3.5 w-3.5" /> {streak.currentStreak} días
          </Badge>
        )}
      </div>

      {/* Resumen calórico */}
      <Card elevated className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        <ProgressRing value={ringValue} size={168} strokeWidth={14} progressClassName={overTarget ? 'text-destructive' : 'text-primary'}>
          <div className="text-center">
            <p className="tabular-nums text-3xl font-bold text-foreground">{consumedKcal}</p>
            <p className="text-xs text-muted">de {targetKcal ? Math.round(targetKcal) : '—'} kcal</p>
          </div>
        </ProgressRing>

        <div className="w-full flex-1 space-y-4">
          {remaining !== null && (
            <p className="text-sm text-muted">
              {overTarget ? (
                <span className="font-medium text-destructive">{Math.round(consumedKcal - targetKcal)} kcal por encima de tu meta</span>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{remaining} kcal</span> restantes hoy
                </>
              )}
            </p>
          )}
          {target && (
            <div className="space-y-3">
              <MacroBar label="Proteína" consumed={totals.protein_g} target={Number(target.protein_grams)} color="protein" />
              <MacroBar label="Carbohidratos" consumed={totals.carbohydrate_g} target={Number(target.carbohydrate_grams)} color="carbs" />
              <MacroBar label="Grasa" consumed={totals.fat_g} target={Number(target.fat_grams)} color="fat" />
            </div>
          )}
        </div>
      </Card>

      <WeightTrendCard />

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
              onDeleteItem={meal ? (item) => handleDeleteItem(meal.id, item) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
