import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Droplet } from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import { hydrationApi } from '@/api/hydration'
import type { HydrationDailyResponse } from '@/api/generated/model'

function formatL(ml: number): string {
  return `${(ml / 1000).toLocaleString('es-MX', { maximumFractionDigits: 1 })} L`
}

/**
 * Compact dashboard card: today's registered plain water plus, when known,
 * a partial/complete estimated total. Never shows the AI as a simple goal or
 * a percentage — the full module lives under /diary/water.
 */
export default function HydrationCard() {
  const [summary, setSummary] = useState<HydrationDailyResponse | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    hydrationApi
      .daily()
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

  return (
    <Card>
      <CardHeader
        title="Agua registrada hoy"
        action={
          <Link to="/diary/water" className="text-sm font-medium text-primary hover:underline">
            Registrar agua
          </Link>
        }
      />
      {summary === null ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : summary.status === 'no_data' ? (
        <div className="flex items-center gap-3">
          <Droplet className="h-6 w-6 shrink-0 text-muted" aria-hidden="true" />
          <p className="text-sm text-muted">Aún no registras agua hoy.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-sm text-foreground">
            <span className="tabular-nums font-semibold">{formatL(summary.plain_water_logged_ml)}</span> de agua simple
          </p>
          {summary.estimated_total_water_ml != null && (
            <p className="text-sm text-muted">
              Estimación total {summary.status === 'complete' ? '' : 'parcial '}
              <span className="tabular-nums">{formatL(summary.estimated_total_water_ml)}</span>
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
