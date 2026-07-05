export type NutrientStatusValue = 'complete' | 'partial' | 'unknown'

/**
 * A nutrient value is never coerced to 0 when the backend marks it unknown or
 * partial — see ADR 0009 (backend) / PLAN_INTEGRACION_FRONTEND_FITNESS_CODEX.md.
 * When no explicit status is supplied, infer it from nullability: this keeps
 * older/lighter endpoints usable without a status field while still refusing
 * to print "0" for a null value.
 */
export function resolveNutrientStatus(value: number | null | undefined, status?: NutrientStatusValue | null): NutrientStatusValue {
  if (status) return status
  return value === null || value === undefined ? 'unknown' : 'complete'
}

export const PARTIAL_NUTRIENT_HINT = 'Valor parcial: faltan datos nutricionales en uno o más elementos.'
export const UNKNOWN_NUTRIENT_LABEL = 'Sin dato'
