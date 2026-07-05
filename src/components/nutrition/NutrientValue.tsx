import { clsx } from 'clsx'
import { type NutrientStatusValue, PARTIAL_NUTRIENT_HINT, UNKNOWN_NUTRIENT_LABEL, resolveNutrientStatus } from '@/lib/nutrientStatus'

interface Props {
  value: number | null | undefined
  status?: NutrientStatusValue | null
  unit?: string
  decimals?: number
  className?: string
}

/**
 * Renders a nutrient amount honoring complete/partial/unknown — never
 * `Number(null) → 0`. Use this instead of formatting nutrient numbers inline.
 */
export default function NutrientValue({ value, status, unit = '', decimals = 0, className }: Props) {
  const resolved = resolveNutrientStatus(value, status)

  if (resolved === 'unknown' || value === null || value === undefined) {
    return <span className={clsx('italic text-muted', className)}>{UNKNOWN_NUTRIENT_LABEL}</span>
  }

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString()

  if (resolved === 'partial') {
    return (
      <span className={clsx('tabular-nums', className)} title={PARTIAL_NUTRIENT_HINT}>
        {formatted}
        {unit}
        <sup>*</sup>
      </span>
    )
  }

  return (
    <span className={clsx('tabular-nums', className)}>
      {formatted}
      {unit}
    </span>
  )
}
