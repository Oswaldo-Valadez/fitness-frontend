import type { NutrientAmountComparison, PeriodNutrientIntakeComparison } from '@/api/generated/model'
import { COMPARISON_DISCLAIMER, comparisonLabel } from '@/lib/nutrientReport'

interface Props {
  comparison: NutrientAmountComparison | PeriodNutrientIntakeComparison | string
  showDisclaimer?: boolean
  className?: string
}

/**
 * Neutral descriptive comparison text ("Por debajo de la referencia
 * registrada", "Por encima del CDRR registrado"...). Never renders a bar,
 * color-only signal or judgmental word (deficient/adequate/healthy). When
 * comparison is "indeterminate" (partial/unknown data) it explains why
 * instead of guessing.
 */
export default function NutrientComparisonText({ comparison, showDisclaimer, className }: Props) {
  return (
    <div className={className}>
      <p className="text-sm text-foreground">{comparisonLabel(comparison)}</p>
      {showDisclaimer && comparison !== 'indeterminate' && <p className="text-xs text-muted">{COMPARISON_DISCLAIMER}</p>}
    </div>
  )
}
