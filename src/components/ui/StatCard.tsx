import { type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  icon?: LucideIcon
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'primary' | 'accent' | 'warning'
  className?: string
}

const TONES = {
  default: 'bg-surface-muted text-muted',
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  warning: 'bg-warning/10 text-warning',
}

export default function StatCard({ icon: Icon, label, value, hint, tone = 'default', className }: Props) {
  return (
    <div className={clsx('rounded-2xl border border-border bg-surface p-5 shadow-card', className)}>
      <div className="flex items-center gap-2 text-sm text-muted">
        {Icon && (
          <span className={clsx('flex h-7 w-7 items-center justify-center rounded-full', TONES[tone])}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        {label}
      </div>
      <p className="tabular-nums mt-2 text-2xl font-bold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}
