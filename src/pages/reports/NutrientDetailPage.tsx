import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { clsx } from 'clsx'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { nutrientsApi } from '@/api/nutrients'
import { type ApiError, normalizeApiError } from '@/api/errors'
import type { NutrientDetailResponse } from '@/api/generated/model'
import NutrientValue from '@/components/nutrition/NutrientValue'
import NutrientReferenceLabel from '@/components/nutrition/NutrientReferenceLabel'
import NutrientComparisonText from '@/components/nutrition/NutrientComparisonText'
import NutrientReferenceExplanation from '@/components/nutrition/NutrientReferenceExplanation'
import NutrientQualityBreakdown from '@/components/nutrition/NutrientQualityBreakdown'
import NutrientDataLimitations from '@/components/nutrition/NutrientDataLimitations'
import Card, { CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PageSpinner from '@/components/ui/PageSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { AVERAGE_LABEL, SPECIAL_NUTRIENT_COPY, coverageNumber, toDisplayStatus } from '@/lib/nutrientReport'

type Period = 7 | 30 | 90

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
]

export default function NutrientDetailPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [period, setPeriod] = useState<Period>(30)
  const [detail, setDetail] = useState<NutrientDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    if (!code) return
    setLoading(true)
    setError(null)
    try {
      setDetail(await nutrientsApi.detail(code, { period }))
    } catch (err) {
      setError(normalizeApiError(err))
    } finally {
      setLoading(false)
    }
  }, [code, period])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [code, period])

  if (loading) return <PageSpinner />

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={
          error.kind === 'not_found'
            ? 'Nutriente no disponible'
            : error.kind === 'consent_required'
              ? 'Consentimiento requerido'
              : 'No fue posible cargar la información'
        }
        description={error.kind === 'not_found' ? 'Este nutriente no existe o no está activo.' : error.message}
        action={error.kind !== 'not_found' ? <Button onClick={load}>Reintentar</Button> : undefined}
      />
    )
  }

  if (!detail) return <p className="py-20 text-center text-muted">Nutriente no encontrado.</p>

  const { definition, summary, reference, informational_references, quality_breakdown, daily_points, limitations } = detail
  const specialCopy = SPECIAL_NUTRIENT_COPY[definition.code] ?? []

  const chartData = daily_points.map((p) => ({
    date: dayjs(p.date).format('D MMM'),
    fullDate: p.date,
    value: p.value ?? null,
    status: p.status,
  }))

  const nutrientDataCoveragePct = coverageNumber(detail.coverage as { [key: string]: unknown }, 'nutrient_data_coverage_pct')
  const diaryCoveragePct = coverageNumber(detail.coverage as { [key: string]: unknown }, 'diary_coverage_pct')

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="secondary" size="sm" iconLeft={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
        Regresar
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{definition.name}</h1>
        <p className="text-sm text-muted">
          Unidad: {definition.unit}
          {definition.description && ` · ${definition.description}`}
        </p>
      </div>

      <Card className="space-y-2">
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
        </div>
      </Card>

      <Card className="space-y-3">
        <CardHeader title={AVERAGE_LABEL} />
        <p className="tabular-nums text-3xl font-bold text-foreground">
          <NutrientValue value={summary.average_value} status={toDisplayStatus(summary.status)} unit={` ${definition.unit}`} />
        </p>
        <NutrientComparisonText comparison={summary.comparison} showDisclaimer />
      </Card>

      <Card className="space-y-2">
        <CardHeader title="Referencia poblacional" />
        <p className="text-sm text-foreground">
          <NutrientReferenceLabel reference={reference} />
        </p>
        <NutrientReferenceExplanation reference={reference} informationalReferences={informational_references} />
      </Card>

      <Card className="space-y-2">
        <CardHeader title="Cobertura de datos" />
        <p className="text-sm text-muted">
          Cobertura del diario: {diaryCoveragePct !== null ? `${Math.round(diaryCoveragePct)} %` : '—'} · Cobertura de datos del nutriente:{' '}
          {nutrientDataCoveragePct !== null ? `${Math.round(nutrientDataCoveragePct)} %` : '—'}
        </p>
      </Card>

      <Card className="space-y-3">
        <CardHeader title="Tendencia" />
        {chartData.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Sin días registrados en este periodo.</p>
        ) : (
          <>
            <div className="h-48 w-full" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(value, _name, item) => {
                      const status = item?.payload?.status
                      if (value === null || value === undefined) return ['Sin dato', '']
                      return [`${value} ${definition.unit}${status === 'partial' ? ' (parcial)' : ''}`, '']
                    }}
                  />
                  {/* null breaks the line — no interpolation across missing days */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={definition.name}
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    dot={(props: any) => {
                      const isPartial = props.payload?.status === 'partial'
                      return (
                        <circle
                          key={`dot-${props.cx}-${props.cy}`}
                          cx={props.cx}
                          cy={props.cy}
                          r={isPartial ? 4 : 3}
                          fill={isPartial ? 'var(--color-surface)' : 'var(--color-primary)'}
                          stroke="var(--color-primary)"
                          strokeWidth={isPartial ? 2 : 1}
                        />
                      )
                    }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <caption className="sr-only">Historial diario de {definition.name}</caption>
                <thead className="text-left text-xs font-medium uppercase text-muted">
                  <tr>
                    <th className="py-1.5">Fecha</th>
                    <th className="py-1.5 text-right">Valor</th>
                    <th className="py-1.5 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {daily_points.map((p) => (
                    <tr key={p.date}>
                      <td className="py-1.5">{dayjs(p.date).format('D MMM YYYY')}</td>
                      <td className="tabular-nums py-1.5 text-right">
                        <NutrientValue value={p.value} status={toDisplayStatus(p.status)} unit={` ${definition.unit}`} />
                      </td>
                      <td className="py-1.5 text-right text-xs text-muted">{statusLabel(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Card>
        <NutrientQualityBreakdown breakdown={quality_breakdown} />
      </Card>

      {specialCopy.length > 0 && (
        <Card className="space-y-1">
          <CardHeader title="Consideraciones para este nutriente" />
          {specialCopy.map((c) => (
            <p key={c} className="text-sm text-muted">
              {c}
            </p>
          ))}
        </Card>
      )}

      <NutrientDataLimitations limitations={limitations} />
    </div>
  )
}

function statusLabel(status: string): string {
  switch (status) {
    case 'complete':
      return 'Completo'
    case 'partial':
      return 'Parcial'
    case 'legacy_fallback':
      return 'Registro anterior'
    case 'no_data':
      return 'Sin registro'
    default:
      return 'Sin dato'
  }
}
