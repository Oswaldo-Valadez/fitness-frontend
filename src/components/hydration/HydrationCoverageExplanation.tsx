import type { HydrationCoverage, HydrationDailyResponseStatus } from '@/api/generated/model'

interface Props {
  status: HydrationDailyResponseStatus
  coverage: HydrationCoverage
}

const STATUS_COPY: Record<HydrationDailyResponseStatus, string> = {
  no_data: 'Sin agua registrada: no hay agua simple ni alimentos registrados este día.',
  unknown: 'Hay alimentos registrados, pero ninguno tiene agua conocida y no registraste agua simple.',
  partial: 'Cobertura parcial: parte del agua es conocida, pero no toda. El total estimado es un subtotal.',
  complete: 'Cobertura completa: todos los alimentos registrados tienen agua conocida.',
}

/** Neutral, descriptive explanation of the day's coverage — never a score or a judgment. */
export default function HydrationCoverageExplanation({ status, coverage }: Props) {
  return (
    <div className="text-sm text-muted">
      <p>{STATUS_COPY[status]}</p>
      {coverage.items_total > 0 && (
        <p className="mt-1">
          Alimentos con agua conocida: {coverage.items_known} de {coverage.items_total}
          {coverage.coverage_pct != null && ` (${coverage.coverage_pct}%)`}.
        </p>
      )}
    </div>
  )
}
