import { useId } from 'react'
import { clsx } from 'clsx'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

export default function Switch({ checked, onChange, label, description, disabled }: Props) {
  const id = useId()

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <label htmlFor={id} className="cursor-pointer">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-surface-muted',
        )}
      >
        <span
          className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[-20px]' : '')}
        />
      </button>
    </div>
  )
}
