import type { ReactNode } from 'react'
import { clsx } from 'clsx'

interface TabItem<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface Props<T extends string> {
  tabs: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export default function Tabs<T extends string>({ tabs, value, onChange, className }: Props<T>) {
  return (
    <div role="tablist" className={clsx('flex gap-1 border-b border-border', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={clsx(
              'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
              active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground hover:border-border',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
