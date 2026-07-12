import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Apple } from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import { nutrientsApi } from '@/api/nutrients'
import type { PeriodNutrientIntakeResponse } from '@/api/generated/model'

/**
 * Compact dashboard card: complete/partial/no-data counts over the last 30
 * days, with a CTA into the full report. Deliberately does not rank or
 * highlight "worst nutrients" — the spec forbids any moral ranking of
 * nutrient status.
 */
export default function MicronutrientsCard() {
  const [report, setReport] = useState<PeriodNutrientIntakeResponse | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    nutrientsApi
      .periodIntake({ period: 30 })
      .then((data) => {
        if (!cancelled) setReport(data)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Keep the dashboard quiet if the module can't load; it has its own page.
  if (failed) return null

  const nutrients = report?.nutrients ?? []
  const complete = nutrients.filter((n) => n.status === 'complete').length
  const partial = nutrients.filter((n) => n.status === 'partial').length
  const noData = nutrients.filter((n) => n.status === 'no_data' || n.status === 'unknown').length

  return (
    <Card>
      <CardHeader
        title="Micronutrientes"
        action={
          <Link to="/reports/nutrients" className="text-sm font-medium text-primary hover:underline">
            Ver nutrientes
          </Link>
        }
      />
      {report === null ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : nutrients.length === 0 ? (
        <div className="flex items-center gap-3">
          <Apple className="h-6 w-6 shrink-0 text-muted" aria-hidden="true" />
          <p className="text-sm text-muted">Aún no hay datos de nutrientes en los últimos 30 días.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground">
          <span className="tabular-nums">
            <span className="font-semibold">{complete}</span> con datos completos
          </span>
          <span className="tabular-nums text-muted">
            <span className="font-semibold text-foreground">{partial}</span> parciales
          </span>
          <span className="tabular-nums text-muted">
            <span className="font-semibold text-foreground">{noData}</span> sin dato
          </span>
        </div>
      )}
    </Card>
  )
}
