import type { HydrationReference } from '@/api/generated/model'

interface Props {
  reference: HydrationReference | null
}

/**
 * Neutral presentation of the population total-water AI. Never renders a
 * percentage, a "missing ml" figure, or goal language — the backend already
 * refuses to compute those; this component doesn't either. Range mode never
 * discloses a midpoint (only min/max, exactly as the API returns them).
 */
export default function HydrationReferenceNotice({ reference }: Props) {
  if (reference === null) {
    return <p className="text-sm text-muted">La referencia de agua total no está disponible para tu perfil actual.</p>
  }

  const value =
    reference.reference_mode === 'exact'
      ? `${reference.value?.toLocaleString('es-MX')} ml`
      : `${reference.minimum?.toLocaleString('es-MX')}–${reference.maximum?.toLocaleString('es-MX')} ml`

  return (
    <div className="rounded-lg bg-surface-muted p-3 text-sm">
      <p className="font-medium text-foreground">Referencia AI de agua total: {value}</p>
      <p className="mt-1 text-muted">
        Corresponde a agua total de alimentos y bebidas (agua simple, otras bebidas y alimentos), no solo a agua simple. Es informativa: no es una meta ni un
        porcentaje de hidratación.
      </p>
    </div>
  )
}
