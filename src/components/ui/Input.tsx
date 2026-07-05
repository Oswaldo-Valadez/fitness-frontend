import { type InputHTMLAttributes, type ReactNode, forwardRef, useId, useState } from 'react'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  iconLeft?: ReactNode
  containerClassName?: string
}

const Input = forwardRef<HTMLInputElement, Props>(({ label, error, helperText, iconLeft, className, containerClassName, id, type, required, ...rest }, ref) => {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && showPassword ? 'text' : type

  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      <div className="relative">
        {iconLeft && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">{iconLeft}</span>}
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={clsx(
            'h-11 w-full rounded-lg border bg-surface px-3 text-[15px] text-foreground shadow-sm outline-none transition-colors placeholder:text-muted',
            'focus:ring-2 focus:ring-ring focus:border-transparent',
            iconLeft && 'pl-10',
            isPassword && 'pr-10',
            error ? 'border-destructive bg-destructive/5' : 'border-border',
            className,
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted hover:text-foreground"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
