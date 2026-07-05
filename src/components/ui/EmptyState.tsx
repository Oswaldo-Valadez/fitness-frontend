import { type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-14 text-center ${className ?? ''}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted">
        <Icon className="h-7 w-7 text-muted" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="mx-auto max-w-xs text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
