import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { nutrientsApi } from '@/api/nutrients'
import { type ApiError, normalizeApiError } from '@/api/errors'
import type { GetPeriodNutrientIntakeParams, PeriodNutrientIntake, PeriodNutrientIntakeResponse } from '@/api/generated/model'
import NutrientValue from '@/components/nutrition/NutrientValue'
import NutrientCoverageBadge from '@/components/nutrition/NutrientCoverageBadge'
import NutrientReferenceLabel from '@/components/nutrition/NutrientReferenceLabel'
import NutrientComparisonText from '@/components/nutrition/NutrientComparisonText'
import NutrientDataLimitations from '@/components/nutrition/NutrientDataLimitations'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PageSpinner from '@/components/ui/PageSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { CATEGORY_FILTERS, NUTRIENTS_DISCLAIMER, PARTIAL_SUBTOTAL_NOTE, STATUS_FILTERS, type StatusFilter, matchesStatusFilter } from '@/lib/nutrientReport'

type Period = 7 | 30 | 90

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
]

export default function NutrientReportPage() {
  const [period, setPeriod] = useState<Period | 'custom'>(30)
  const [startDate, setStartDate] = useState(dayjs().subtract(29, 'day').format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [category, setCategory] = useState<(typeof CATEGORY_FILTERS)[number]['value']>('all')
  const [status, setStatus] = useState<StatusFilter>('all')

  const [report, setReport] = useState<PeriodNutrientIntakeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: GetPeriodNutrientIntakeParams = period === 'custom' ? { start_date: startDate, end_date: endDate } : { period }
      setReport(await nutrientsApi.periodIntake(params))
    } catch (err) {
      setError(normalizeApiError(err))
    } finally {
      setLoading(false)
    }
  }, [period, startDate, endDate])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [period])

  const nutrients = (report?.nutrients ?? []).filter((n) => (category === 'all' || n.category === category) && matchesStatusFilter(n.status, status))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nutrientes</h1>
        <p className="max-w-2xl text-sm text-muted">Consulta los nutrientes registrados y la cobertura de los datos de tus alimentos.</p>
      </div>

      <p className="max-w-2xl text-xs text-muted">{NUTRIENTS_DISCLAIMER}</p>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={clsx(
                'cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                period === p.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setPeriod('custom')}
            className={clsx(
              'cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              period === 'custom' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
            )}
          >
            Personalizado
          </button>
        </div>

        {period === 'custom' && (
          <div className="flex flex-wrap items-end gap-3">
            <Input id="nutrient-report-start" label="Desde" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input id="nutrient-report-end" label="Hasta" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Button size="sm" onClick={load}>
              Aplicar
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Categoría</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={clsx(
                    'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    category === c.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Estado de los datos</legend>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={clsx(
                    'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    status === s.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </Card>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title={error.kind === 'consent_required' ? 'Consentimiento requerido' : 'No fue posible cargar la información'}
          description={error.message}
          action={<Button onClick={load}>Reintentar</Button>}
        />
      ) : !report || nutrients.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="Sin nutrientes para mostrar"
          description="No hay datos de nutrientes para el periodo y los filtros seleccionados."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nutrients.map((n) => (
              <NutrientCard key={n.code} nutrient={n} />
            ))}
          </div>
          <NutrientDataLimitations limitations={report.limitations} />
        </>
      )}
    </div>
  )
}

function NutrientCard({ nutrient }: { nutrient: PeriodNutrientIntake }) {
  const isPartial = nutrient.status === 'partial'
  const decimals = nutrient.display_precision ?? 0

  return (
    <Card padding="sm" className="space-y-2">
      <Link to={`/reports/nutrients/${nutrient.code}`} className="block">
        <p className="font-semibold text-foreground hover:underline">{nutrient.name}</p>
      </Link>
      <p className="tabular-nums text-xl font-bold text-foreground">
        <NutrientValue
          value={nutrient.average_value}
          status={nutrient.status === 'no_data' ? 'unknown' : nutrient.status}
          unit={` ${nutrient.unit}`}
          decimals={decimals}
        />
      </p>
      <NutrientCoverageBadge coveragePct={coveragePct(nutrient)} />
      {isPartial && <p className="text-xs text-muted">{PARTIAL_SUBTOTAL_NOTE}</p>}
      <p className="text-xs text-muted">
        <NutrientReferenceLabel reference={nutrient.reference} />
      </p>
      {!isPartial && <NutrientComparisonText comparison={nutrient.comparison} className="text-xs" />}
    </Card>
  )
}

/** nutrient_data_coverage_pct lives in the untyped coverage bag (see PeriodNutrientIntakeCoverage). */
function coveragePct(nutrient: PeriodNutrientIntake): number | null {
  const value = (nutrient.coverage as { [key: string]: unknown })?.nutrient_data_coverage_pct
  return typeof value === 'number' ? value : null
}
