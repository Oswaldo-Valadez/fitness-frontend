import { useState } from 'react'
import dayjs from 'dayjs'
import { Droplet, Pencil, Trash2 } from 'lucide-react'
import { hydrationApi } from '@/api/hydration'
import { normalizeApiError } from '@/api/errors'
import type { HydrationEntry } from '@/api/generated/model'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/toast'
import HydrationEditEntryModal from './HydrationEditEntryModal'

interface Props {
  entries: HydrationEntry[]
  onChanged: () => void
}

/** List of the day's plain-water entries with edit/delete. Owner isolation and validation live server-side. */
export default function HydrationEntryList({ entries, onChanged }: Props) {
  const { show } = useToast()
  const [editing, setEditing] = useState<HydrationEntry | null>(null)
  const [deleting, setDeleting] = useState<HydrationEntry | null>(null)

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await hydrationApi.deleteEntry(deleting.id)
      show({ variant: 'success', message: 'Registro de agua eliminado.' })
      onChanged()
    } catch (error) {
      show({ variant: 'error', message: normalizeApiError(error).message })
    }
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
        <Droplet className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
        <p className="text-sm text-muted">Aún no registras agua simple hoy.</p>
      </div>
    )
  }

  return (
    <div role="list" aria-label="Registros de agua simple" className="divide-y divide-border">
      {entries.map((entry) => (
        <div key={entry.id} role="listitem" className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <Droplet className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-medium tabular-nums text-foreground">{entry.volume_ml.toLocaleString('es-MX')} ml</p>
              <p className="text-xs text-muted">
                {dayjs(entry.occurred_at).format('HH:mm')}
                {entry.note && ` · ${entry.note}`}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" aria-label={`Editar registro de ${entry.volume_ml} ml`} onClick={() => setEditing(entry)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Eliminar registro de ${entry.volume_ml} ml`} onClick={() => setDeleting(entry)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ))}

      <HydrationEditEntryModal
        entry={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          onChanged()
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar registro de agua"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </div>
  )
}
