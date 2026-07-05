import { useEffect, useState } from 'react'
import { type FoodSource, adminApi } from '@/api/admin'
import type { Food } from '@/types/models'
import { getFoodMacros } from '@/lib/nutrients'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  food?: Food | null
}

interface FormState {
  name: string
  category: string
  food_source_id: string
  data_type: 'generic' | 'branded' | 'manual'
  energy_kcal: string
  protein_g: string
  carbohydrate_g: string
  fat_g: string
  fiber_g: string
  sodium_mg: string
}

const EMPTY: FormState = {
  name: '',
  category: '',
  food_source_id: '',
  data_type: 'generic',
  energy_kcal: '',
  protein_g: '',
  carbohydrate_g: '',
  fat_g: '',
  fiber_g: '',
  sodium_mg: '',
}

export default function FoodFormModal({ open, onClose, onSaved, food }: Props) {
  const [sources, setSources] = useState<FoodSource[]>([])
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    adminApi.sources().then(setSources)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(() => {
      if (!food) return EMPTY
      const macros = getFoodMacros(food)
      return {
        name: food.name,
        category: food.category ?? '',
        food_source_id: '',
        data_type: food.data_type,
        energy_kcal: String(macros.energy_kcal),
        protein_g: String(macros.protein_g),
        carbohydrate_g: String(macros.carbohydrate_g),
        fat_g: String(macros.fat_g),
        fiber_g: macros.fiber_g !== null ? String(macros.fiber_g) : '',
        sodium_mg: macros.sodium_mg !== null ? String(macros.sodium_mg) : '',
      }
    })
    setError('')
  }, [open, food])

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        category: form.category || undefined,
        food_source_id: Number(form.food_source_id),
        data_type: form.data_type,
        energy_kcal: form.energy_kcal ? Number(form.energy_kcal) : undefined,
        protein_g: form.protein_g ? Number(form.protein_g) : undefined,
        carbohydrate_g: form.carbohydrate_g ? Number(form.carbohydrate_g) : undefined,
        fat_g: form.fat_g ? Number(form.fat_g) : undefined,
        fiber_g: form.fiber_g ? Number(form.fiber_g) : undefined,
        sodium_mg: form.sodium_mg ? Number(form.sodium_mg) : undefined,
      }
      if (food) await adminApi.updateFood(food.id, payload)
      else await adminApi.createFood(payload)
      onSaved()
    } catch {
      setError('No se pudo guardar el alimento. Revisa los campos.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={food ? 'Editar alimento' : 'Nuevo alimento'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="food-name" label="Nombre" value={form.name} onChange={set('name')} required />
          <Input id="food-category" label="Categoría" value={form.category} onChange={set('category')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {!food && (
            <Select id="food-source" label="Fuente" value={form.food_source_id} onChange={set('food_source_id')} required>
              <option value="" disabled>
                Selecciona una fuente
              </option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
          <Select id="food-data-type" label="Tipo" value={form.data_type} onChange={set('data_type')} required>
            <option value="generic">Genérico</option>
            <option value="branded">De marca</option>
            <option value="manual">Manual</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input id="food-kcal" label="Kcal/100g" type="number" step={0.1} value={form.energy_kcal} onChange={set('energy_kcal')} required />
          <Input id="food-protein" label="Proteína (g)" type="number" step={0.1} value={form.protein_g} onChange={set('protein_g')} required />
          <Input id="food-carbs" label="Carbos (g)" type="number" step={0.1} value={form.carbohydrate_g} onChange={set('carbohydrate_g')} required />
          <Input id="food-fat" label="Grasa (g)" type="number" step={0.1} value={form.fat_g} onChange={set('fat_g')} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input id="food-fiber" label="Fibra (g)" type="number" step={0.1} value={form.fiber_g} onChange={set('fiber_g')} />
          <Input id="food-sodium" label="Sodio (mg)" type="number" step={0.1} value={form.sodium_mg} onChange={set('sodium_mg')} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {food ? 'Guardar cambios' : 'Crear alimento'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
