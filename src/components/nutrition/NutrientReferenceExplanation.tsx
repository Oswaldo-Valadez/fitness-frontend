import type { NutrientReference } from '@/api/generated/model'
import { REFERENCE_TYPE_DEFINITIONS, REFERENCE_TYPE_LABELS } from '@/lib/nutrientReport'

interface Props {
  reference: NutrientReference | null
  informationalReferences?: NutrientReference[]
  className?: string
}

/**
 * Explains what the reference type(s) mean (RDA/AI/CDRR definitions) and, for
 * range mode, that the range reflects both sexes without disclosing which
 * end applies to which — the app never infers or displays a midpoint.
 */
export default function NutrientReferenceExplanation({ reference, informationalReferences = [], className }: Props) {
  if (!reference) {
    return (
      <p className={className ? `${className} text-sm text-muted` : 'text-sm text-muted'}>
        No hay una referencia poblacional disponible para este nutriente en tu contexto actual.
      </p>
    )
  }

  const allReferences = [reference, ...informationalReferences]

  return (
    <div className={className}>
      <ul className="space-y-2 text-sm text-muted">
        {allReferences.map((ref) => (
          <li key={`${ref.reference_type}-${ref.nutrient_code}`}>
            <span className="font-medium text-foreground">{REFERENCE_TYPE_LABELS[ref.reference_type] ?? ref.reference_type}: </span>
            {REFERENCE_TYPE_DEFINITIONS[ref.reference_type]}
          </li>
        ))}
      </ul>
      {reference.reference_mode === 'range' && (
        <p className="mt-2 text-sm text-muted">
          Se muestra un rango poblacional porque no se especificó el sexo para las ecuaciones. El rango no representa un punto medio ni un valor recomendado
          único.
        </p>
      )}
    </div>
  )
}
