import { SCOPE_LIMITATION } from '@/lib/nutrientReport'

interface Props {
  limitations?: string[]
  className?: string
}

/**
 * Renders backend-provided limitation copy plus the fixed "only logged foods"
 * scope note. All wording is descriptive/neutral — never diagnostic,
 * never a supplement recommendation.
 */
export default function NutrientDataLimitations({ limitations = [], className }: Props) {
  const items = [...new Set([SCOPE_LIMITATION, ...limitations])]

  return (
    <ul className={className ? `${className} space-y-1 text-xs text-muted` : 'space-y-1 text-xs text-muted'}>
      {items.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  )
}
