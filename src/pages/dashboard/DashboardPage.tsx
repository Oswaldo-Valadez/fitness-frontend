import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { dashboardApi, type DailySummary } from '@/api/dashboard'
import Button from '@/components/ui/Button'
import PageSpinner from '@/components/ui/PageSpinner'
import MacroBar from './MacroBar'
import MealGroup from './MealGroup'

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const dateParam = searchParams.get('date') ?? dayjs().format('YYYY-MM-DD')
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (date: string) => {
    setLoading(true)
    try {
      setSummary(await dashboardApi.getSummary(date))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(dateParam) }, [dateParam, load])

  const goDate = (delta: number) => {
    const next = dayjs(dateParam).add(delta, 'day').format('YYYY-MM-DD')
    setSearchParams({ date: next })
  }

  const isToday = dateParam === dayjs().format('YYYY-MM-DD')

  if (loading) return <PageSpinner />

  const { totals, target, meals } = summary!

  return (
    <div className="space-y-6">
      {/* Navegación de fecha */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => goDate(-1)}>← Ayer</Button>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">
            {dayjs(dateParam).format('dddd D [de] MMMM')}
          </p>
          {isToday && <span className="text-xs text-emerald-600 font-medium">Hoy</span>}
        </div>
        <Button variant="secondary" onClick={() => goDate(1)} disabled={isToday}>Mañana →</Button>
      </div>

      {/* Resumen calórico */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Calorías consumidas</p>
            <p className="text-4xl font-bold text-gray-900">{Math.round(totals.energy_kcal)}</p>
          </div>
          {target?.target_kcal && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Meta</p>
              <p className="text-2xl font-semibold text-emerald-600">{Math.round(Number(target.target_kcal))}</p>
            </div>
          )}
        </div>

        {target && (
          <div className="space-y-3">
            <MacroBar label="Proteína" consumed={totals.protein_g} target={Number(target.protein_grams)} color="blue" />
            <MacroBar label="Carbohidratos" consumed={totals.carbohydrate_g} target={Number(target.carbohydrate_grams)} color="amber" />
            <MacroBar label="Grasa" consumed={totals.fat_g} target={Number(target.fat_grams)} color="rose" />
          </div>
        )}
      </div>

      {/* Comidas del día */}
      <div className="space-y-4">
        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
          const meal = meals.find((m) => m.meal_type === type)
          return (
            <MealGroup
              key={type}
              mealType={type}
              meal={meal ?? null}
              date={dateParam}
              onUpdated={() => load(dateParam)}
              onAddMeal={() => navigate(`/diary?date=${dateParam}&type=${type}`)}
            />
          )
        })}
      </div>
    </div>
  )
}
