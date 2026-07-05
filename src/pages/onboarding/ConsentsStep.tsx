import { useState } from 'react'
import { AlertCircle, Check, FileText, HeartPulse, Shield } from 'lucide-react'
import { clsx } from 'clsx'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { onboardingApi } from '@/api/profile'

const CONSENTS = [
  {
    type: 'terms' as const,
    label: 'Términos y condiciones',
    description: 'Acepto los términos de uso del servicio.',
    version: '1.0.0',
    icon: FileText,
  },
  {
    type: 'privacy' as const,
    label: 'Política de privacidad',
    description: 'Acepto la política de privacidad y el tratamiento de mis datos.',
    version: '1.0.0',
    icon: Shield,
  },
  {
    type: 'general_wellness_disclaimer' as const,
    label: 'Aviso de bienestar general',
    description: 'Entiendo que esta app es solo para bienestar general y no reemplaza asesoría médica.',
    version: '1.0.0',
    icon: HeartPulse,
  },
]

interface Props {
  onAccepted: () => void
  api: typeof onboardingApi
}

export default function ConsentsStep({ onAccepted, api }: Props) {
  const [accepted, setAccepted] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const allChecked = CONSENTS.every((c) => accepted[c.type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allChecked) return
    setLoading(true)
    setError('')
    try {
      await api.acceptConsents(CONSENTS.map((c) => ({ type: c.type, document_version: c.version })))
      onAccepted()
    } catch {
      setError('No se pudieron guardar los consentimientos. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card padding="lg" elevated className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Consentimientos requeridos</h2>
        <p className="mt-1 text-sm text-muted">Para usar la app debes aceptar los siguientes documentos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {CONSENTS.map((c) => {
          const Icon = c.icon
          const checked = !!accepted[c.type]
          return (
            <label
              key={c.type}
              className={clsx(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                checked ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-surface-muted',
              )}
            >
              <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => setAccepted({ ...accepted, [c.type]: e.target.checked })} />
              <span
                className={clsx(
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  checked ? 'bg-primary text-on-primary' : 'bg-surface-muted text-muted',
                )}
              >
                {checked ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <div>
                <p className="font-medium text-foreground">{c.label}</p>
                <p className="text-sm text-muted">{c.description}</p>
              </div>
            </label>
          )
        })}

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        )}

        <Button type="submit" loading={loading} disabled={!allChecked} className="w-full" size="lg">
          Continuar
        </Button>
      </form>
    </Card>
  )
}
