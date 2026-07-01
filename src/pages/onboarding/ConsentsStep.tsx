import { useState } from 'react'
import Button from '@/components/ui/Button'
import { onboardingApi } from '@/api/profile'

const CONSENTS = [
  {
    type: 'terms' as const,
    label: 'Términos y condiciones',
    description: 'Acepto los términos de uso del servicio.',
    version: '1.0.0',
  },
  {
    type: 'privacy' as const,
    label: 'Política de privacidad',
    description: 'Acepto la política de privacidad y el tratamiento de mis datos.',
    version: '1.0.0',
  },
  {
    type: 'general_wellness_disclaimer' as const,
    label: 'Aviso de bienestar general',
    description: 'Entiendo que esta app es solo para bienestar general y no reemplaza asesoría médica.',
    version: '1.0.0',
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
      await api.acceptConsents(
        CONSENTS.map((c) => ({ type: c.type, document_version: c.version })),
      )
      onAccepted()
    } catch {
      setError('No se pudieron guardar los consentimientos. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-md space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Consentimientos requeridos</h2>
        <p className="mt-1 text-sm text-gray-500">
          Para usar la app debes aceptar los siguientes documentos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {CONSENTS.map((c) => (
          <label key={c.type} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              checked={!!accepted[c.type]}
              onChange={(e) => setAccepted({ ...accepted, [c.type]: e.target.checked })}
            />
            <div>
              <p className="font-medium text-gray-800">{c.label}</p>
              <p className="text-sm text-gray-500">{c.description}</p>
            </div>
          </label>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" loading={loading} disabled={!allChecked} className="w-full">
          Continuar
        </Button>
      </form>
    </div>
  )
}
