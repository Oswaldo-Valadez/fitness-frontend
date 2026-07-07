import { useState } from 'react'
import dayjs from 'dayjs'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useToast } from '@/components/ui/toast'
import { dietQualityApi } from '@/api/dietQuality'
import type { DietQualityGoal } from '@/api/generated/model'
import { normalizeApiError } from '@/api/errors'
import { UNIT_LABELS } from './copy'

interface Props {
  goal: DietQualityGoal | null
  onClose: () => void
  onSaved: () => void
}

/**
 * Manual check-in: local date (never future), value, optional note.
 * A repeated save on the same date replaces the previous value (upsert).
 */
export default function DietQualityCheckInModal({ goal, onClose, onSaved }: Props) {
  const today = dayjs().format('YYYY-MM-DD')
  const [date, setDate] = useState(today)
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { show } = useToast()

  if (!goal) return null

  const isBinary = goal.direction === 'binary'

  const handleSave = async () => {
    const numeric = isBinary ? (value === '1' ? 1 : 0) : Number(value)
    if (!isBinary && (value.trim() === '' || Number.isNaN(numeric) || numeric < 0)) {
      setError('Ingresa un valor numérico igual o mayor a 0.')
      return
    }
    if (date > today) {
      setError('No se aceptan fechas futuras.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await dietQualityApi.upsertCheckIn(goal.id, date, {
        value: numeric,
        note: note.trim() === '' ? null : note.trim(),
      })
      show({ variant: 'success', message: 'Registro guardado.' })
      onSaved()
      onClose()
    } catch (err) {
      setError(normalizeApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Registrar avance" description={goal.title}>
      <div className="space-y-4">
        <Input id="check-in-date" label="Fecha" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />

        {isBinary ? (
          <fieldset>
            <legend className="mb-1 block text-sm font-medium text-foreground">¿Coincidió hoy?</legend>
            <div className="flex gap-2">
              <Button variant={value === '1' ? 'primary' : 'secondary'} size="sm" onClick={() => setValue('1')}>
                Sí
              </Button>
              <Button variant={value === '0' ? 'primary' : 'secondary'} size="sm" onClick={() => setValue('0')}>
                No
              </Button>
            </div>
          </fieldset>
        ) : (
          <Input
            id="check-in-value"
            label={`Valor (${UNIT_LABELS[goal.unit] ?? goal.unit})`}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}

        <Input id="check-in-note" label="Nota (opcional)" type="text" maxLength={250} value={note} onChange={(e) => setNote(e.target.value)} />

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={saving} onClick={handleSave} disabled={isBinary && value === ''}>
            Guardar registro
          </Button>
        </div>
      </div>
    </Modal>
  )
}
