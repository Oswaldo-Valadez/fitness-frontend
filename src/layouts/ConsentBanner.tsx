import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

/**
 * Persistent notice shown after a mutation is rejected with 409
 * CONSENT_REQUIRED. Reads and navigation stay available — only the next
 * mutation attempt is blocked by the backend — so this never redirects on
 * its own; it just offers a path back to reaccept.
 */
export default function ConsentBanner() {
  const consentRequired = useAppSelector((s) => s.auth.consentRequired)

  if (!consentRequired) return null

  return (
    <div className="flex items-center gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-foreground">
      <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
      <p className="min-w-0 flex-1 truncate">{consentRequired.message || 'Debes aceptar los consentimientos vigentes para continuar.'}</p>
      <Link to="/onboarding" className="shrink-0 rounded-md bg-warning/20 px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-warning/30">
        Revisar consentimientos
      </Link>
    </div>
  )
}
