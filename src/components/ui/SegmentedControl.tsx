import type { ReactNode } from 'react'
import { clsx } from 'clsx'

interface Option<T extends string> {
  value: T
  label: ReactNode
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  'aria-label': string
}

export default function SegmentedControl<T extends string>({ options, value, onChange, className, ...rest }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={rest['aria-label']} className={clsx('inline-flex rounded-lg border border-border bg-surface-muted p-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={clsx(
              'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
