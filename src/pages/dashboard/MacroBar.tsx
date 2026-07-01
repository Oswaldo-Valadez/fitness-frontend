interface Props {
  label: string
  consumed: number
  target: number
  color: 'blue' | 'amber' | 'rose' | 'emerald'
}

const COLORS = {
  blue:    'bg-blue-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
  emerald: 'bg-emerald-500',
}

export default function MacroBar({ label, consumed, target, color }: Props) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0
  const over = target > 0 && consumed > target

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span className={over ? 'text-red-500 font-medium' : ''}>
          {Math.round(consumed)}g / {Math.round(target)}g
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all ${over ? 'bg-red-400' : COLORS[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
