interface Props {
  label: string
  consumed: number
  target: number
  color: 'protein' | 'carbs' | 'fat'
}

const COLORS = {
  protein: 'bg-protein',
  carbs: 'bg-carbs',
  fat: 'bg-fat',
}

const DOT_COLORS = {
  protein: 'bg-protein',
  carbs: 'bg-carbs',
  fat: 'bg-fat',
}

export default function MacroBar({ label, consumed, target, color }: Props) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0
  const over = target > 0 && consumed > target

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-muted">
          <span className={`h-2 w-2 rounded-full ${DOT_COLORS[color]}`} />
          {label}
        </span>
        <span className={`tabular-nums ${over ? 'font-semibold text-destructive' : 'text-muted'}`}>
          {Math.round(consumed)}g / {Math.round(target)}g
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-muted">
        <div className={`h-2 rounded-full transition-all duration-500 ${over ? 'bg-destructive' : COLORS[color]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
