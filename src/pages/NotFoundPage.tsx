import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass className="h-8 w-8" aria-hidden="true" />
      </span>
      <div>
        <p className="text-lg font-semibold text-foreground">Página no encontrada</p>
        <p className="mt-1 text-sm text-muted">La página que buscas no existe o fue movida.</p>
      </div>
      <Link to="/dashboard">
        <Button>Volver al panel</Button>
      </Link>
    </div>
  )
}
