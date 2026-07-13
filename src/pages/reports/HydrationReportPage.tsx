import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { hydrationApi } from '@/api/hydration'
import { type ApiError, normalizeApiError } from '@/api/errors'
import type { HydrationPeriodResponse } from '@/api/generated/model'
import Card, { CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PageSpinner from '@/components/ui/PageSpinner'
import EmptyState from '@/components/ui/EmptyState'
import HydrationReferenceNotice from '@/components/hydration/HydrationReferenceNotice'

type Period = 7 | 30 | 90

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
]

function statusLabel(status: string): string {
  switch (status) {
    case 'complete':
      return 'Completo'
    case 'partial':
      return 'Parcial'
    case 'unknown':
      return 'Sin agua conocida'
    default:
      return 'Sin registro'
  }
}

function fmt(value: number | null): string {
  return value == null ? '—' : `${value.toLocaleString('es-MX')} ml`
}

/** Longitudinal hydration report: plain water, dietary water and estimated total kept separate. No forecast, no streaks. */
export default function HydrationReportPage() {
  const [period, setPeriod] = useState<Period>(30)
  const [report, setReport] = useState<HydrationPeriodResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setReport(await hydrationApi.period({ period }))
    } catch (err) {
      setError(normalizeApiError(err))
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [period])

  if (loading) return <PageSpinner />

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No fue posible cargar la información"
        description={error.message}
        action={<Button onClick={load}>Reintentar</Button>}
      />
    )
  }

  if (!report) return <p className="py-20 text-center text-muted">Sin datos de hidratación.</p>

  const { summary, daily_points, reference, limitations, notices } = report

  const chartData = daily_points.map((p) => ({
    date: dayjs(p.date).format('D MMM'),
    plain: p.plain_water_logged_ml,
    dietary: p.dietary_water_ml,
    total: p.estimated_total_water_ml,
    status: p.status,
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hidratación</h1>
        <p className="text-sm text-muted">Agua simple registrada y agua estimada en alimentos, siempre por separado.</p>
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

      <Card className="space-y-2">
        <CardHeader title="Resumen del periodo" />
        <p className="text-sm text-foreground">
          Días con agua registrada: <span className="tabular-nums font-semibold">{summary.days_with_plain_water}</span> de{' '}
          <span className="tabular-nums">{summary.days_total}</span>
        </p>
        <p className="text-sm text-muted">
          Promedio de agua simple ({summary.average_label}):{' '}
          <span className="tabular-nums">{summary.average_plain_water_ml != null ? `${summary.average_plain_water_ml.toLocaleString('es-MX')} ml` : '—'}</span>
        </p>
        <p className="text-sm text-muted">
          Días con cobertura completa: <span className="tabular-nums">{summary.days_complete_coverage}</span>
        </p>
      </Card>

      <Card className="space-y-2">
        <CardHeader title="Referencia AI de agua total" />
        <HydrationReferenceNotice reference={reference} />
      </Card>

      <Card className="space-y-3">
        <CardHeader title="Tendencia" />
        {chartData.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Sin días registrados en este periodo.</p>
        ) : (
          <>
            <div className="h-56 w-full" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(value, name) => [value == null ? 'Sin dato' : `${value} ml`, name]}
                  />
                  {/* null breaks each line — no interpolation across missing days, no forecast */}
                  <Line
                    type="monotone"
                    dataKey="plain"
                    name="Agua simple"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    connectNulls={false}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dietary"
                    name="Agua en alimentos"
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    connectNulls={false}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total estimado"
                    stroke="var(--color-muted)"
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                    connectNulls={false}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <caption className="sr-only">Historial diario de hidratación registrada</caption>
                <thead className="text-left text-xs font-medium uppercase text-muted">
                  <tr>
                    <th className="py-1.5">Fecha</th>
                    <th className="py-1.5 text-right">Agua simple</th>
                    <th className="py-1.5 text-right">Agua en alimentos</th>
                    <th className="py-1.5 text-right">Total estimado</th>
                    <th className="py-1.5 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {daily_points.map((p) => (
                    <tr key={p.date}>
                      <td className="py-1.5">{dayjs(p.date).format('D MMM YYYY')}</td>
                      <td className="tabular-nums py-1.5 text-right">{fmt(p.plain_water_logged_ml)}</td>
                      <td className="tabular-nums py-1.5 text-right">{fmt(p.dietary_water_ml)}</td>
                      <td className="tabular-nums py-1.5 text-right">{fmt(p.estimated_total_water_ml)}</td>
                      <td className="py-1.5 text-right text-xs text-muted">{statusLabel(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {limitations.length > 0 && (
        <Card className="space-y-1">
          <CardHeader title="Consideraciones" />
          {limitations.map((l) => (
            <p key={l} className="text-sm text-muted">
              {l}
            </p>
          ))}
        </Card>
      )}

      {notices.map((notice) => (
        <p key={notice} className="text-xs text-muted">
          {notice}
        </p>
      ))}
    </div>
  )
}
