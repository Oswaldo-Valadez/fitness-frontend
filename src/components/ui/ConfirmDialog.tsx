import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

/** Confirmation dialog for destructive actions — replaces window.confirm(). */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
}: Props) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={handleConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
