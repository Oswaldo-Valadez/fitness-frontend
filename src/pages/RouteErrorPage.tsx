import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'

/** Route-level error boundary (createBrowserRouter errorElement). */
export default function RouteErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()

  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Ocurrió un error inesperado.'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-8 w-8" aria-hidden="true" />
      </span>
      <div>
        <p className="text-lg font-semibold text-foreground">Algo salió mal</p>
        <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Volver
        </Button>
        <Button onClick={() => navigate('/dashboard', { replace: true })}>Ir al panel</Button>
      </div>
    </div>
  )
}
