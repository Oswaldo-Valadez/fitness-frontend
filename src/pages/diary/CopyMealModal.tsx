import { useState } from 'react'
import dayjs from 'dayjs'
import { mealApi } from '@/api/meals'
import { newIdempotencyKey } from '@/api/templates'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'

interface Props {
  mealId: number | null
  onClose: () => void
  onCopied: () => void
}

export default function CopyMealModal({ mealId, onClose, onCopied }: Props) {
  const { show } = useToast()
  const [targetDate, setTargetDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'))
  const [copying, setCopying] = useState(false)

  if (!mealId) return null

  const handleCopy = async () => {
    setCopying(true)
    try {
      const { warnings, differences } = await mealApi.copy(mealId, { target_date: targetDate, idempotency_key: newIdempotencyKey() })
      ;[...warnings, ...differences].forEach((w) => show({ variant: 'info', message: w, duration: 6000 }))
      show({ variant: 'success', message: `Comida copiada a ${dayjs(targetDate).format('D MMM')}.` })
      onCopied()
      onClose()
    } catch {
      show({ variant: 'error', message: 'No se pudo copiar la comida (¿ya se copió a esa fecha?).' })
    } finally {
      setCopying(false)
    }
  }

  return (
    <Modal open={!!mealId} onClose={onClose} title="Copiar comida a otra fecha" size="sm">
      <div className="space-y-4">
        <Input id="copy-target-date" label="Fecha destino" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
        <p className="text-xs text-muted">
          Los valores se recalculan con los datos actuales de cada alimento o receta — no siempre serán idénticos al original.
        </p>
        <Button className="w-full" loading={copying} onClick={handleCopy}>
          Copiar
        </Button>
      </div>
    </Modal>
  )
}
