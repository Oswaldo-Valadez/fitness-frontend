import { clsx } from 'clsx'

export default function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-lg bg-surface-muted', className)} role="presentation" aria-hidden="true" />
}

/** Skeleton shaped like a stat/summary card, used while dashboard data loads. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('rounded-2xl border border-border bg-surface p-6 shadow-card', className)}>
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-4 h-9 w-32" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  )
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-3 py-3', className)}>
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}
