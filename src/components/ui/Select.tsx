import { type SelectHTMLAttributes, forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

const Select = forwardRef<HTMLSelectElement, Props>(({ label, error, className, id, children, required, ...rest }, ref) => {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={!!error}
          className={clsx(
            'h-11 w-full appearance-none rounded-lg border bg-surface pl-3 pr-9 text-[15px] text-foreground shadow-sm outline-none transition-colors',
            'focus:ring-2 focus:ring-ring focus:border-transparent',
            error ? 'border-destructive' : 'border-border',
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
})

Select.displayName = 'Select'
export default Select
