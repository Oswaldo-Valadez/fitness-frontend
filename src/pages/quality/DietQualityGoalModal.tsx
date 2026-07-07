import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'
import { dietQualityApi } from '@/api/dietQuality'
import type { DietQualityFocusCandidate } from '@/api/generated/model'
import { normalizeApiError } from '@/api/errors'
import { GOALS_DISCLAIMER, UNIT_LABELS } from './copy'

interface Props {
  candidate: DietQualityFocusCandidate | null
  sourceAssessmentId: number | null
  onClose: () => void
  onCreated: () => void
}

/**
 * Explicit goal confirmation: nothing is auto-created — the user reviews the
 * catalog snapshot and confirms.
 */
export default function DietQualityGoalModal({ candidate, sourceAssessmentId, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { show } = useToast()

  if (!candidate) return null

  const handleConfirm = async () => {
    setSaving(true)
    setError(null)
    try {
      await dietQualityApi.createGoal(candidate.focus_code, sourceAssessmentId)
      show({ variant: 'success', message: 'Meta creada. Puedes registrarla cuando tú quieras.' })
      onCreated()
      onClose()
    } catch (err) {
      setError(normalizeApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  const unitLabel = UNIT_LABELS[candidate.unit] ?? candidate.unit

  return (
    <Modal open onClose={onClose} title="Elegir como meta" description={candidate.title}>
      <div className="space-y-4">
        <p className="text-sm text-foreground">{candidate.description}</p>
        <div className="rounded-lg bg-surface-muted p-3 text-sm text-foreground">
          <p>
            <span className="font-medium">Referencia del instrumento:</span>{' '}
            {candidate.direction === 'at_most' ? 'menos de' : candidate.direction === 'at_least' ? 'al menos' : 'registro de'}{' '}
            <span className="tabular-nums">{candidate.target_value}</span> {unitLabel}
          </p>
          <p className="text-xs text-muted">Periodo: {candidate.period === 'week' ? 'semana (lunes a domingo)' : 'día'}</p>
        </div>
        <p className="text-xs text-muted">{candidate.disclaimer || GOALS_DISCLAIMER}</p>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={saving} onClick={handleConfirm}>
            Confirmar meta
          </Button>
        </div>
      </div>
    </Modal>
  )
}
