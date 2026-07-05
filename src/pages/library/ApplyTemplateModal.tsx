import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { newIdempotencyKey, templatesApi } from '@/api/templates'
import type { MealLogMealType, MealTemplate } from '@/api/generated/model'
import { MEAL_LABELS, MEAL_TYPES } from '@/lib/mealTypes'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'

interface Props {
  template: MealTemplate | null
  onClose: () => void
}

export default function ApplyTemplateModal({ template, onClose }: Props) {
  const navigate = useNavigate()
  const { show } = useToast()
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [time, setTime] = useState(dayjs().format('HH:mm'))
  const [mealType, setMealType] = useState<MealLogMealType>(template?.default_meal_type ?? 'breakfast')
  const [applying, setApplying] = useState(false)

  if (!template) return null

  const handleApply = async () => {
    setApplying(true)
    try {
      const { warnings } = await templatesApi.apply(template.id as number, {
        date,
        time,
        meal_type: mealType,
        idempotency_key: newIdempotencyKey(),
      })
      warnings.forEach((w) => show({ variant: 'info', message: w, duration: 6000 }))
      show({ variant: 'success', message: 'Plantilla aplicada al diario.' })
      onClose()
      navigate(`/diary?date=${date}`)
    } catch {
      show({ variant: 'error', message: 'No se pudo aplicar la plantilla (¿ya se aplicó con esta fecha/hora?).' })
    } finally {
      setApplying(false)
    }
  }

  return (
    <Modal open={!!template} onClose={onClose} title={`Aplicar "${template.name}"`} size="sm">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input id="apply-date" label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input id="apply-time" label="Hora" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <Select id="apply-meal-type" label="Comida" value={mealType} onChange={(e) => setMealType(e.target.value as MealLogMealType)}>
          {MEAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {MEAL_LABELS[t]}
            </option>
          ))}
        </Select>
        <Button className="w-full" loading={applying} onClick={handleApply}>
          Aplicar al diario
        </Button>
      </div>
    </Modal>
  )
}
