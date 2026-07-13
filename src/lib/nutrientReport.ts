import type {
  NutrientAmountComparison,
  NutrientAmountStatus,
  NutrientDailyPointStatus,
  NutrientDefinitionCategory,
  NutrientReferenceDirection,
  NutrientReferenceReferenceType,
  PeriodNutrientIntakeComparison,
  PeriodNutrientIntakeStatus,
} from '@/api/generated/model'
import type { NutrientStatusValue } from '@/lib/nutrientStatus'

/**
 * Shared copy and small pure helpers for the Sprint 4G nutrients UI. The
 * backend owns all clinical/scientific judgment (status, comparison,
 * reference resolution) — everything here is presentation-only: labels,
 * category grouping and status-value mapping. Never invent thresholds here.
 */

export const NUTRIENTS_DISCLAIMER =
  'Las comparaciones usan referencias poblacionales para personas sanas y no diagnostican deficiencias. Solo incluyen alimentos registrados; no incluyen suplementos ni otras fuentes no capturadas.'

export const CATEGORY_LABELS: Record<string, string> = {
  energy: 'Energía',
  macro: 'Macronutrientes',
  mineral: 'Minerales',
  vitamin: 'Vitaminas',
  other: 'Otros',
}

export const CATEGORY_FILTERS: { value: 'all' | NutrientDefinitionCategory; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'mineral', label: 'Minerales' },
  { value: 'vitamin', label: 'Vitaminas' },
  { value: 'other', label: 'Otros' },
]

export type StatusFilter = 'all' | 'complete' | 'partial' | 'unknown'

export const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'complete', label: 'Datos completos' },
  { value: 'partial', label: 'Datos parciales' },
  { value: 'unknown', label: 'Sin dato' },
]

/**
 * Maps the backend's 4-5 value status enums (no_data/unknown/partial/complete
 * [/legacy_fallback]) onto the 3-value NutrientStatusValue that NutrientValue
 * understands. `no_data` and `legacy_fallback` are display-equivalent to
 * `unknown`: there is no known amount to show as a number either way.
 */
export function toDisplayStatus(
  status: NutrientAmountStatus | NutrientDailyPointStatus | PeriodNutrientIntakeStatus | string | null | undefined,
): NutrientStatusValue {
  if (status === 'complete') return 'complete'
  if (status === 'partial') return 'partial'
  return 'unknown'
}

export function matchesStatusFilter(status: string, filter: StatusFilter): boolean {
  if (filter === 'all') return true
  return toDisplayStatus(status) === filter
}

export const REFERENCE_TYPE_LABELS: Record<NutrientReferenceReferenceType, string> = {
  RDA: 'RDA',
  AI: 'AI',
  CDRR: 'CDRR',
}

export const REFERENCE_TYPE_DEFINITIONS: Record<NutrientReferenceReferenceType, string> = {
  RDA: 'Nivel diario que cubre las necesidades de casi todas las personas sanas del grupo de referencia.',
  AI: 'Nivel asumido como adecuado cuando no existe evidencia suficiente para establecer una RDA.',
  CDRR: 'La CDRR indica el nivel por encima del cual reducir la ingesta se espera que reduzca riesgo de enfermedad crónica en una población aparentemente sana. No es un límite de toxicidad.',
}

export const REFERENCE_DIRECTION_LABELS: Record<NutrientReferenceDirection, string> = {
  at_least: 'Referencia de consumo mínimo',
  informational: 'Referencia informativa',
  reduce_if_above: 'Referencia de reducción si se supera',
}

const COMPARISON_LABELS: Record<NutrientAmountComparison | PeriodNutrientIntakeComparison, string> = {
  indeterminate: 'Comparación no disponible con datos parciales o sin dato',
  below_reference: 'Por debajo de la referencia registrada',
  at_or_above_reference: 'En o por encima de la referencia registrada',
  below_reference_range: 'Por debajo del rango de referencia',
  within_reference_range: 'Dentro del rango de referencia',
  above_reference_range: 'Por encima del rango de referencia',
  above_cdrr: 'Por encima del CDRR registrado',
  at_or_below_cdrr: 'En o por debajo del CDRR registrado',
  not_comparable_reference_changed: 'No comparable: la referencia cambió durante el periodo',
}

export function comparisonLabel(comparison: string): string {
  return COMPARISON_LABELS[comparison as NutrientAmountComparison] ?? comparison
}

export const COMPARISON_DISCLAIMER = 'Comparación descriptiva con una referencia poblacional. No diagnostica una deficiencia.'

export const PARTIAL_SUBTOTAL_NOTE = 'El subtotal puede estar subestimado'

export const AVERAGE_LABEL = 'Promedio de días registrados'

/** Only-alimentos-registrados scope note, shown once per report/detail view. */
export const SCOPE_LIMITATION =
  'Los cálculos incluyen los alimentos registrados en la aplicación. No incluyen suplementos, exposición solar, agua ni sal agregada, salvo que esos valores estén incluidos expresamente en el alimento registrado.'

/** Copy for nutrients with special limitations, keyed by nutrient code (spec section "Copy por nutrientes especiales"). */
export const SPECIAL_NUTRIENT_COPY: Record<string, string[]> = {
  sodium_mg: ['La estimación puede omitir sal agregada al cocinar o en la mesa.', 'La CDRR no es un límite de toxicidad.'],
  potassium_mg: ['Las referencias generales pueden no aplicar en enfermedad renal o con ciertos medicamentos.'],
  iron_mg: ['La absorción varía según el alimento y el patrón dietético. Este registro no diagnostica anemia.'],
  vitamin_d_mcg: ['La ingesta alimentaria no representa exposición solar ni concentraciones sanguíneas.'],
  folate_dfe_mcg: ['Los valores se expresan como equivalentes de folato dietético cuando la fuente los proporciona.'],
}

/** Reads a numeric field from the untyped `coverage`/`{[key:string]:unknown}` response bags. */
export function coverageNumber(bag: { [key: string]: unknown } | undefined, key: string): number | null {
  const value = bag?.[key]
  return typeof value === 'number' ? value : null
}

/**
 * Static code→category map for the 16 tracked nutrients (matches
 * database/seeders/NutrientSeeder.php on the backend). `FoodNutrientProvenance`
 * rows don't carry `category`, so food detail/forms group by this fixed
 * list instead of re-deriving it from the catalog endpoint on every render.
 */
export const MINERAL_CODES = ['calcium_mg', 'iron_mg', 'magnesium_mg', 'potassium_mg', 'sodium_mg', 'zinc_mg'] as const
export const VITAMIN_CODES = ['vitamin_a_rae_mcg', 'vitamin_c_mg', 'vitamin_d_mcg', 'vitamin_b12_mcg', 'folate_dfe_mcg'] as const

/**
 * The optional micronutrient codes beyond the six legacy fields, in display
 * order for forms: the 10 introduced in Sprint 4 plus water_ml (Sprint 5).
 * water_ml here is the food's own water content (used to estimate dietary
 * water in the diary) — distinct from the manual plain-water entries under
 * /diary/water, which never touch this catalog.
 */
export const OPTIONAL_MICRONUTRIENT_FIELDS: { code: string; label: string; unit: string; step: number }[] = [
  { code: 'calcium_mg', label: 'Calcio', unit: 'mg', step: 0.1 },
  { code: 'iron_mg', label: 'Hierro', unit: 'mg', step: 0.01 },
  { code: 'magnesium_mg', label: 'Magnesio', unit: 'mg', step: 0.1 },
  { code: 'potassium_mg', label: 'Potasio', unit: 'mg', step: 0.1 },
  { code: 'zinc_mg', label: 'Zinc', unit: 'mg', step: 0.01 },
  { code: 'vitamin_a_rae_mcg', label: 'Vitamina A', unit: 'mcg RAE', step: 0.1 },
  { code: 'vitamin_c_mg', label: 'Vitamina C', unit: 'mg', step: 0.1 },
  { code: 'vitamin_d_mcg', label: 'Vitamina D', unit: 'mcg', step: 0.1 },
  { code: 'vitamin_b12_mcg', label: 'Vitamina B12', unit: 'mcg', step: 0.01 },
  { code: 'folate_dfe_mcg', label: 'Folato', unit: 'mcg DFE', step: 0.1 },
  { code: 'water_ml', label: 'Agua (del alimento)', unit: 'ml', step: 0.1 },
]

export const QUALITY_STATUS_LABELS: Record<string, string> = {
  verified: 'Verificado',
  source_reported: 'Reportado por la fuente',
  user_reported: 'Capturado por el usuario',
  estimated: 'Estimado',
  unknown: 'Sin dato',
}
