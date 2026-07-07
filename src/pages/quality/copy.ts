/**
 * Copy required by the Sprint 3 spec. The scientific framing is fixed:
 * descriptive language only, no clinical bands, no success/failure morals.
 */
export const QUALITY_HEADER_TITLE = 'Calidad de dieta'

export const QUALITY_HEADER_SUBTITLE = 'Explora cómo se alinean tus hábitos autodeclarados con un instrumento breve de patrón mediterráneo.'

export const QUALITY_DISCLAIMER = 'Este resultado es descriptivo y no sustituye una evaluación nutricional o médica.'

export const ALCOHOL_NOTICE = 'El MEDAS-14 original incluye una pregunta sobre vino. No comiences ni aumentes el consumo de alcohol para modificar el puntaje.'

export const NO_DATA_COPY = 'Aún no hay datos suficientes para describir este periodo.'

export const GOALS_DISCLAIMER =
  'Estas metas son opcionales y las eliges tú. El registro muestra tu información, no evalúa tu valor personal ni garantiza resultados de salud.'

/** Neutral, non-judgemental labels for goal progress comparisons. */
export const COMPARISON_LABELS: Record<string, string> = {
  no_data: 'Sin datos suficientes',
  below_threshold_so_far: 'Por debajo del umbral hasta ahora',
  meets_threshold_so_far: 'Coincide con el umbral hasta ahora',
  within_threshold_so_far: 'Dentro del umbral hasta ahora',
  exceeds_threshold_so_far: 'Por encima del umbral hasta ahora',
  recorded_false: 'Registrado: no',
  recorded_true: 'Registrado: sí',
}

export const UNIT_LABELS: Record<string, string> = {
  tablespoons_per_day: 'cucharadas/día',
  servings_per_day: 'porciones/día',
  units_per_day: 'piezas/día',
  servings_per_week: 'porciones/semana',
  glasses_per_week: 'copas/semana',
  boolean: '',
}
