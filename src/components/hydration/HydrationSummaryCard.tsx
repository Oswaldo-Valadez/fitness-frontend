import Card, { CardHeader } from '@/components/ui/Card'
import type { HydrationDailyResponse } from '@/api/generated/model'
import HydrationCoverageExplanation from './HydrationCoverageExplanation'
import HydrationReferenceNotice from './HydrationReferenceNotice'

interface Props {
  summary: HydrationDailyResponse
}

function formatMl(value: number | null | undefined): string {
  return value == null ? '—' : `${value.toLocaleString('es-MX')} ml`
}

/**
 * Daily hydration summary. The three volumes are ALWAYS shown as separate
 * figures — plain water registered manually, dietary water estimated from
 * diary items, and their sum — never fused into a single number (spec §2).
 */
export default function HydrationSummaryCard({ summary }: Props) {
  return (
    <Card>
      <CardHeader title="Hidratación" subtitle="Registra agua simple y consulta el agua estimada de los alimentos capturados." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Agua simple registrada</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatMl(summary.plain_water_logged_ml)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Agua estimada en alimentos</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatMl(summary.dietary_water_ml)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Agua total estimada</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatMl(summary.estimated_total_water_ml)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3 border-t border-border pt-4">
        <HydrationCoverageExplanation status={summary.status} coverage={summary.coverage} />
        <HydrationReferenceNotice reference={summary.reference} />
        <p className="text-xs text-muted">
          Este registro no mide tu estado fisiológico de hidratación. La referencia mostrada corresponde a agua total de alimentos y bebidas.
        </p>
        {summary.notices.map((notice) => (
          <p key={notice} className="text-xs text-muted">
            {notice}
          </p>
        ))}
      </div>
    </Card>
  )
}
