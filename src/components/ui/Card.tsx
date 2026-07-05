import { type HTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  elevated?: boolean
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
}

export default function Card({ padding = 'md', elevated, className, children, ...rest }: CardProps) {
  return (
    <div className={clsx('rounded-2xl border border-border bg-surface', elevated ? 'shadow-elevated' : 'shadow-card', PADDING[padding], className)} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-4 flex items-start justify-between gap-3', className)}>
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
