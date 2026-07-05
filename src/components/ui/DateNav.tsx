import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  date: string // YYYY-MM-DD
  onChange: (date: string) => void
  showWeekStrip?: boolean
}

/** Shared date navigator for Dashboard/Diary — prev/next day + optional 7-day quick-jump strip. */
export default function DateNav({ date, onChange, showWeekStrip = false }: Props) {
  const today = dayjs().format('YYYY-MM-DD')
  const isToday = date === today
  const goDate = (delta: number) => onChange(dayjs(date).add(delta, 'day').format('YYYY-MM-DD'))

  const weekStart = dayjs(date).startOf('week')
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => goDate(-1)}
          aria-label="Día anterior"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-center">
          <p className="text-lg font-semibold capitalize text-foreground">{dayjs(date).format('dddd D [de] MMMM')}</p>
          {isToday ? (
            <span className="text-xs font-medium text-accent">Hoy</span>
          ) : (
            <button onClick={() => onChange(today)} className="cursor-pointer text-xs font-medium text-primary hover:underline">
              Ir a hoy
            </button>
          )}
        </div>

        <button
          onClick={() => goDate(1)}
          disabled={isToday}
          aria-label="Día siguiente"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {showWeekStrip && (
        <div className="flex justify-between gap-1">
          {weekDays.map((d) => {
            const key = d.format('YYYY-MM-DD')
            const active = key === date
            const future = d.isAfter(dayjs(), 'day')
            return (
              <button
                key={key}
                disabled={future}
                onClick={() => onChange(key)}
                className={clsx(
                  'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs transition-colors',
                  active ? 'bg-primary text-on-primary' : 'text-muted hover:bg-surface-muted disabled:opacity-30',
                )}
              >
                <span>{d.format('dd').slice(0, 1).toUpperCase()}</span>
                <span className="tabular-nums font-semibold">{d.format('D')}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
