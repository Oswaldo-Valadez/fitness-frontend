import type { NutrientReference } from '@/api/generated/model'
import { REFERENCE_TYPE_LABELS } from '@/lib/nutrientReport'

interface Props {
  reference: NutrientReference | null
  className?: string
}

/**
 * Renders a resolved reference as text only: "1000 mg (RDA)" for exact mode,
 * "8–18 mg (RDA)" for range mode. Range mode NEVER shows a midpoint, an
 * average of the two ends, or attributes an end to a sex — the backend
 * intentionally withholds that attribution when sex_for_equation is
 * undisclosed, and this component must not reconstruct it.
 */
export default function NutrientReferenceLabel({ reference, className }: Props) {
  if (!reference) {
    return (
      <span className={className}>
        <span className="italic text-muted">Referencia no disponible</span>
      </span>
    )
  }

  const typeLabel = REFERENCE_TYPE_LABELS[reference.reference_type] ?? reference.reference_type

  if (reference.reference_mode === 'exact') {
    return (
      <span className={className}>
        {reference.value} {reference.unit} ({typeLabel})
      </span>
    )
  }

  return (
    <span className={className}>
      {reference.minimum}–{reference.maximum} {reference.unit} ({typeLabel})
    </span>
  )
}
