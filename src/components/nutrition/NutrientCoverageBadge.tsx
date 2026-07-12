import Badge from '@/components/ui/Badge'
import type { NutrientCoverage } from '@/api/generated/model'

interface Props {
  /** Item-level coverage for one day (from a daily/detail response). */
  coverage?: NutrientCoverage
  /** Pre-computed percentage (e.g. a period response's nutrient_data_coverage_pct), when item-level counts aren't available. */
  coveragePct?: number | null
  className?: string
}

/**
 * Item-level data coverage for one nutrient ("Datos conocidos en 68 % de los
 * elementos"). Neutral badge — never green/red, coverage is a data-quality
 * fact, not a clinical judgment.
 */
export default function NutrientCoverageBadge({ coverage, coveragePct, className }: Props) {
  const pct = coverage ? coverage.coverage_pct : (coveragePct ?? null)
  const hasData = coverage ? coverage.items_total > 0 && pct !== null : pct !== null

  if (!hasData) {
    return (
      <Badge variant="neutral" className={className}>
        Sin elementos registrados
      </Badge>
    )
  }

  return (
    <Badge variant="neutral" className={className}>
      Datos conocidos en {Math.round(pct!)}&nbsp;% de los elementos
    </Badge>
  )
}
