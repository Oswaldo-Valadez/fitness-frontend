import { useEffect, useState } from 'react'
import { foodsApi } from '@/api/foods'
import type { FoodPortion } from '@/api/generated/model'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  foodId: number
  portion?: FoodPortion | null
}

interface FormState {
  description: string
  amount: string
  unit_label: string
  gram_weight: string
}

const EMPTY: FormState = { description: '', amount: '', unit_label: '', gram_weight: '' }

export default function PortionFormModal({ open, onClose, onSaved, foodId, portion }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError('')
    setForm(
      portion
        ? {
            description: portion.description,
            amount: String(portion.amount),
            unit_label: portion.unit_label,
            gram_weight: String(portion.gram_weight),
          }
        : EMPTY,
    )
  }, [open, portion])

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        description: form.description,
        amount: Number(form.amount),
        unit_label: form.unit_label,
        gram_weight: Number(form.gram_weight),
      }
      if (portion) await foodsApi.updatePortion(portion.id, payload)
      else await foodsApi.createPortion(foodId, payload)
      onSaved()
    } catch {
      setError('No se pudo guardar la porción. Revisa los campos.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={portion ? 'Editar porción' : 'Nueva porción'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="portion-description" label="Descripción" placeholder="1 taza cocida" value={form.description} onChange={set('description')} required />
        <div className="grid grid-cols-2 gap-4">
          <Input id="portion-amount" label="Cantidad" type="number" step={0.001} min={0.001} value={form.amount} onChange={set('amount')} required />
          <Input id="portion-unit-label" label="Unidad" placeholder="taza" value={form.unit_label} onChange={set('unit_label')} required />
        </div>
        <Input
          id="portion-gram-weight"
          label="Equivalencia en gramos"
          type="number"
          step={0.01}
          min={0.01}
          value={form.gram_weight}
          onChange={set('gram_weight')}
          required
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {portion ? 'Guardar cambios' : 'Crear porción'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
