import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import { dietQualityApi } from '@/api/dietQuality'
import type { DietQualitySummary } from '@/api/generated/model'

/**
 * Compact dashboard card: latest MEDAS-14 score, assessment age and active
 * goals. Descriptive only — the full module lives under /reports/quality.
 */
export default function DietQualityCard() {
  const [summary, setSummary] = useState<DietQualitySummary | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    dietQualityApi
      .summary(30)
      .then((data) => {
        if (!cancelled) setSummary(data)
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

  const latest = summary?.latest_assessment ?? null
  const activeGoals = summary?.active_goals.length ?? 0

  return (
    <Card>
      <CardHeader
        title="Calidad de dieta"
        action={
          <Link to="/reports/quality" className="text-sm font-medium text-primary hover:underline">
            Ver calidad de dieta
          </Link>
        }
      />
      {summary === null ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : latest === null ? (
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 shrink-0 text-muted" aria-hidden="true" />
          <p className="text-sm text-muted">Aún no tienes evaluaciones. Responde el cuestionario MEDAS-14 cuando quieras.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-sm text-foreground">
            Último MEDAS-14:{' '}
            <span className="tabular-nums font-semibold">
              {latest.score}/{latest.max_score}
            </span>
          </p>
          <p className="text-sm text-muted">
            {summary.assessment_age_days === 0 ? 'Evaluado hoy' : `Evaluado hace ${summary.assessment_age_days} días`}
            {summary.can_retake && ' · puedes repetirlo cuando quieras'}
          </p>
          <p className="text-sm text-muted">{activeGoals === 0 ? 'Sin metas activas' : activeGoals === 1 ? '1 meta activa' : `${activeGoals} metas activas`}</p>
        </div>
      )}
    </Card>
  )
}
