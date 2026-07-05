import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Download } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { clsx } from 'clsx'
import { reportsApi } from '@/api/reports'
import type { GetNutritionReportPeriod, NutritionReport } from '@/api/generated/model'
import NutrientValue from '@/components/nutrition/NutrientValue'
import NutrientStatusLegend from '@/components/nutrition/NutrientStatusLegend'
import Card, { CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PageSpinner from '@/components/ui/PageSpinner'
import Switch from '@/components/ui/Switch'

const PERIODS: { value: GetNutritionReportPeriod; label: string }[] = [
  { value: 7, label: '7 días' },
  { value: 14, label: '14 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
]

export default function ReportsPage() {
  const [period, setPeriod] = useState<GetNutritionReportPeriod | 'custom'>(7)
  const [startDate, setStartDate] = useState(dayjs().subtract(6, 'day').format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [includeWeight, setIncludeWeight] = useState(false)
  const [report, setReport] = useState<NutritionReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const params =
        period === 'custom' ? { start_date: startDate, end_date: endDate, include_weight: includeWeight } : { period, include_weight: includeWeight }
      setReport(await reportsApi.get(params))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [period, includeWeight])

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(format)
    try {
      if (format === 'json') await reportsApi.downloadJson()
      else await reportsApi.downloadCsv(report?.start_date ?? startDate, report?.end_date ?? endDate)
    } finally {
      setExporting(null)
    }
  }

  const hasPartialDays = report?.days?.some((d) => d.nutrient_status?.energy_kcal === 'partial') ?? false

  const chartData = (report?.days ?? []).map((d) => ({
    date: dayjs(d.date).format('D MMM'),
    kcal: d.totals?.energy_kcal ?? null,
    target: d.target_kcal ?? null,
  }))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" iconLeft={<Download className="h-4 w-4" />} loading={exporting === 'json'} onClick={() => handleExport('json')}>
            JSON
          </Button>
          <Button variant="secondary" size="sm" iconLeft={<Download className="h-4 w-4" />} loading={exporting === 'csv'} onClick={() => handleExport('csv')}>
            CSV
          </Button>
        </div>
      </div>

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
            <Input id="report-start" label="Desde" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input id="report-end" label="Hasta" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Button size="sm" onClick={load}>
              Aplicar
            </Button>
          </div>
        )}

        <Switch checked={includeWeight} onChange={setIncludeWeight} label="Incluir peso corporal" />
      </Card>

      {loading || !report ? (
        <PageSpinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatBox
              label="Cobertura"
              value={`${report.summary?.coverage_pct ?? 0}%`}
              hint={`${report.summary?.days_logged ?? 0}/${report.summary?.days_total ?? 0} días`}
            />
            <StatBox label="Comidas registradas" value={String(report.summary?.meals_count ?? 0)} />
            <StatBox label="Promedio diario" value={<NutrientValue value={report.summary?.daily_averages?.energy_kcal} unit=" kcal" />} />
            <StatBox label="Proteína prom." value={<NutrientValue value={report.summary?.daily_averages?.protein_g} unit=" g" />} />
          </div>

          <Card>
            <CardHeader title="Energía vs. meta" />
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(value) => (value === null || value === undefined ? ['Sin dato', ''] : [`${value} kcal`, ''])}
                  />
                  <Line type="monotone" dataKey="kcal" name="Consumido" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Meta"
                    stroke="var(--color-muted)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-muted text-left text-xs font-medium uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Comidas</th>
                    <th className="px-4 py-3 text-right">Energía</th>
                    <th className="px-4 py-3 text-right">Meta</th>
                    <th className="px-4 py-3 text-right">Diferencia</th>
                    {includeWeight && <th className="px-4 py-3 text-right">Peso</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(report.days ?? []).map((day) => (
                    <tr key={day.date} className={!day.logged ? 'text-muted' : undefined}>
                      <td className="px-4 py-2.5">{dayjs(day.date).format('D MMM')}</td>
                      <td className="tabular-nums px-4 py-2.5 text-right">{day.logged ? day.meals_count : '—'}</td>
                      <td className="tabular-nums px-4 py-2.5 text-right">
                        <NutrientValue value={day.totals?.energy_kcal} status={day.nutrient_status?.energy_kcal} unit=" kcal" />
                      </td>
                      <td className="tabular-nums px-4 py-2.5 text-right">{day.target_available ? `${Math.round(day.target_kcal ?? 0)} kcal` : '—'}</td>
                      <td className="tabular-nums px-4 py-2.5 text-right">
                        {day.energy_vs_target_kcal !== null && day.energy_vs_target_kcal !== undefined
                          ? `${day.energy_vs_target_kcal > 0 ? '+' : ''}${day.energy_vs_target_kcal} kcal`
                          : '—'}
                      </td>
                      {includeWeight && <td className="tabular-nums px-4 py-2.5 text-right">{day.weight_kg ?? '—'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {hasPartialDays && <NutrientStatusLegend />}
          <p className="text-xs text-muted">{report.unknown_value_indicator}</p>
        </>
      )}
    </div>
  )
}

function StatBox({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card padding="sm">
      <p className="text-xs text-muted">{label}</p>
      <p className="tabular-nums text-xl font-bold text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </Card>
  )
}
