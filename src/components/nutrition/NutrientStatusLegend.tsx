import { PARTIAL_NUTRIENT_HINT } from '@/lib/nutrientStatus'

/** Small footnote explaining the `*` marker; render once near any partial value. */
export default function NutrientStatusLegend({ className }: { className?: string }) {
  return (
    <p className={className ? `${className} text-xs text-muted` : 'text-xs text-muted'}>
      <sup>*</sup> {PARTIAL_NUTRIENT_HINT}
    </p>
  )
}
