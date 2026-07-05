import { useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { clsx } from 'clsx'
import { type ThemePreference, getStoredTheme, setTheme } from '@/lib/theme'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

/** Compact light/dark/system theme switcher, persisted to localStorage. */
export default function ThemeToggle({ className }: { className?: string }) {
  const [pref, setPref] = useState<ThemePreference>(getStoredTheme)

  const handleChange = (value: ThemePreference) => {
    setPref(value)
    setTheme(value)
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema de la aplicación"
      className={clsx('inline-flex items-center rounded-lg border border-border bg-surface-muted p-1', className)}
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon
        const active = pref === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.label}
            onClick={() => handleChange(opt.value)}
            className={clsx(
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors',
              active ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
