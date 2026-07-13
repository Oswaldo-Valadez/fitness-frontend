import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { hydrationApi } from '@/api/hydration'
import { normalizeApiError } from '@/api/errors'
import type { HydrationEntry } from '@/api/generated/model'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'

interface Props {
  entry: HydrationEntry | null
  onClose: () => void
  onSaved: () => void
}

/** Edit an existing plain-water entry: volume, time and note. Volume/time bounds are enforced server-side. */
export default function HydrationEditEntryModal({ entry, onClose, onSaved }: Props) {
  const { show } = useToast()
  const [volumeMl, setVolumeMl] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!entry) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVolumeMl(String(entry.volume_ml))
    setTime(dayjs(entry.occurred_at).format('HH:mm'))
    setNote(entry.note ?? '')
  }, [entry])

  if (!entry) return null

  const handleSave = async () => {
    const volume = Number(volumeMl)
    if (!Number.isFinite(volume) || volume <= 0) {
      show({ variant: 'error', message: 'Ingresa un volumen válido.' })
      return
    }

    const occurredAt = dayjs(entry.occurred_at).format('YYYY-MM-DD') + 'T' + time
    setSaving(true)
    try {
      await hydrationApi.updateEntry(entry.id, {
        volume_ml: volume,
        occurred_at: dayjs(occurredAt).format(),
        note: note || null,
      })
      show({ variant: 'success', message: 'Registro de agua actualizado.' })
      onSaved()
      onClose()
    } catch (error) {
      show({ variant: 'error', message: normalizeApiError(error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={entry !== null} onClose={onClose} title="Editar registro de agua" size="sm">
      <div className="space-y-4">
        <Input
          id="edit-hydration-volume"
          label="Volumen (ml)"
          type="number"
          min={1}
          inputMode="numeric"
          value={volumeMl}
          onChange={(e) => setVolumeMl(e.target.value)}
        />
        <Input id="edit-hydration-time" label="Hora" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <Input id="edit-hydration-note" label="Nota (opcional)" placeholder="Ej. Vaso grande" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button className="w-full" loading={saving} onClick={handleSave}>
          Guardar cambios
        </Button>
      </div>
    </Modal>
  )
}
