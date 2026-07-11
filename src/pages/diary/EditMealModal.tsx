import { useEffect, useState } from 'react'
import { mealApi } from '@/api/meals'
import type { MealLog } from '@/api/generated/model'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'

interface Props {
  meal: MealLog | null
  onClose: () => void
  onSaved: () => void
}

export default function EditMealModal({ meal, onClose, onSaved }: Props) {
  const { show } = useToast()
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!meal) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(meal.name ?? '')
    setNotes(meal.notes ?? '')
  }, [meal])

  if (!meal) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await mealApi.update(meal.id as number, { name: name || null, notes: notes || null })
      show({ variant: 'success', message: 'Comida actualizada.' })
      onSaved()
      onClose()
    } catch {
      show({ variant: 'error', message: 'No se pudo actualizar la comida.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!meal} onClose={onClose} title="Editar comida" size="sm">
      <div className="space-y-4">
        <Input id="edit-meal-name" label="Nombre (opcional)" placeholder="Ej. Almuerzo con amigos" value={name} onChange={(e) => setName(e.target.value)} />
        <Input id="edit-meal-notes" label="Notas (opcional)" placeholder="Ej. Sin cebolla" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button className="w-full" loading={saving} onClick={handleSave}>
          Guardar cambios
        </Button>
      </div>
    </Modal>
  )
}
