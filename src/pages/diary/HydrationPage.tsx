import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { AlertTriangle } from 'lucide-react'
import { hydrationApi } from '@/api/hydration'
import { type ApiError, normalizeApiError } from '@/api/errors'
import type { HydrationDailyResponse } from '@/api/generated/model'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DateNav from '@/components/ui/DateNav'
import PageSpinner from '@/components/ui/PageSpinner'
import EmptyState from '@/components/ui/EmptyState'
import HydrationQuickAdd from '@/components/hydration/HydrationQuickAdd'
import HydrationEntryList from '@/components/hydration/HydrationEntryList'
import HydrationSummaryCard from '@/components/hydration/HydrationSummaryCard'

/**
 * Water tab under /diary. Registers ONLY plain water — dietary water comes
 * from the diary items already logged under "Comidas". The two are always
 * shown separately, never merged (spec §2).
 */
export default function HydrationPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const date = searchParams.get('date') ?? dayjs().format('YYYY-MM-DD')

  const [summary, setSummary] = useState<HydrationDailyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSummary(await hydrationApi.daily({ date }))
    } catch (err) {
      setError(normalizeApiError(err))
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return (
    <div className="space-y-5">
      <DateNav date={date} onChange={(newDate) => setSearchParams({ date: newDate })} />

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="No fue posible cargar la información"
          description={error.message}
          action={<Button onClick={load}>Reintentar</Button>}
        />
      ) : summary === null ? null : (
        <>
          <HydrationSummaryCard summary={summary} />

          <Card>
            <h3 className="mb-3 font-semibold text-foreground">Registrar agua simple</h3>
            <HydrationQuickAdd onAdded={load} />
          </Card>

          <Card>
            <h3 className="mb-1 font-semibold text-foreground">Registros de hoy</h3>
            <p className="mb-3 text-xs text-muted">Evita registrar la misma agua aquí y como alimento en el diario.</p>
            <HydrationEntryList entries={summary.entries} onChanged={load} />
          </Card>
        </>
      )}
    </div>
  )
}
