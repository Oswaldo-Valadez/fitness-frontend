import type { NutrientQualityBreakdown as NutrientQualityBreakdownModel } from '@/api/generated/model'

interface Props {
  breakdown: NutrientQualityBreakdownModel
  className?: string
}

const LABELS: { key: keyof NutrientQualityBreakdownModel; label: string }[] = [
  { key: 'verified', label: 'Verificado' },
  { key: 'source_reported', label: 'Reportado por la fuente' },
  { key: 'user_reported', label: 'Capturado por el usuario' },
  { key: 'estimated', label: 'Estimado' },
  { key: 'unknown', label: 'Sin dato' },
]

/**
 * Shows "Origen de los datos" — counts of contributing items per
 * data-provenance bucket. Never a universal quality/confidence score; the
 * backend explicitly forbids that framing (no "clinical confidence").
 */
export default function NutrientQualityBreakdown({ breakdown, className }: Props) {
  const entries = LABELS.map(({ key, label }) => ({ label, count: breakdown[key] })).filter((e) => e.count > 0)

  if (entries.length === 0) {
    return <p className={className ? `${className} text-sm text-muted` : 'text-sm text-muted'}>Sin datos de origen disponibles.</p>
  }

  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Origen de los datos</p>
      <ul className="space-y-1 text-sm text-foreground">
        {entries.map((e) => (
          <li key={e.label} className="flex items-center justify-between gap-3">
            <span className="text-muted">{e.label}</span>
            <span className="tabular-nums font-medium">{e.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
