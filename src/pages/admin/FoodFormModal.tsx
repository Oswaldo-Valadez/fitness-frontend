import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { type Food, type FoodSource, adminApi } from '@/api/admin'
import { getFoodMacros, nutrientAmountOrNull } from '@/lib/nutrients'
import { OPTIONAL_MICRONUTRIENT_FIELDS } from '@/lib/nutrientReport'
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
  /** All tracked codes beyond the six legacy fields (10 Sprint-4 micronutrients + water_ml), code -> raw input string. Blank means unknown, never 0. */
  micronutrients: Record<string, string>
}

const EMPTY_MICRONUTRIENTS: Record<string, string> = Object.fromEntries(OPTIONAL_MICRONUTRIENT_FIELDS.map((f) => [f.code, '']))

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
  micronutrients: EMPTY_MICRONUTRIENTS,
}

/** Empty string means "unknown" (null) — never coerced to 0. */
function numberOrNull(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
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
      const micronutrients = Object.fromEntries(
        OPTIONAL_MICRONUTRIENT_FIELDS.map(({ code }) => {
          const amount = nutrientAmountOrNull(food, code)
          return [code, amount !== null ? String(amount) : '']
        }),
      )
      return {
        name: food.name,
        category: food.category ?? '',
        food_source_id: '',
        data_type: food.data_type,
        energy_kcal: macros.energy_kcal !== null ? String(macros.energy_kcal) : '',
        protein_g: macros.protein_g !== null ? String(macros.protein_g) : '',
        carbohydrate_g: macros.carbohydrate_g !== null ? String(macros.carbohydrate_g) : '',
        fat_g: macros.fat_g !== null ? String(macros.fat_g) : '',
        fiber_g: macros.fiber_g !== null ? String(macros.fiber_g) : '',
        sodium_mg: macros.sodium_mg !== null ? String(macros.sodium_mg) : '',
        micronutrients,
      }
    })
    setError('')
  }, [open, food])

  const set = (k: keyof Omit<FormState, 'micronutrients'>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const setMicronutrient = (code: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, micronutrients: { ...f.micronutrients, [code]: e.target.value } }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        category: form.category || undefined,
        // Only sent when creating: the edit form doesn't re-collect the
        // source, and the backend keeps the existing value when this key
        // is absent — sending 0 (Number('') on the hidden edit field)
        // fails `exists:food_sources,id` and silently breaks every edit.
        ...(food ? {} : { food_source_id: Number(form.food_source_id) }),
        data_type: form.data_type,
        // Legacy top-level fields kept for compatibility with the existing
        // contract; the canonical dynamic payload (below) is not limited to
        // these six, so blank/zero semantics only need to hold on nutrients.
        energy_kcal: form.energy_kcal ? Number(form.energy_kcal) : undefined,
        protein_g: form.protein_g ? Number(form.protein_g) : undefined,
        carbohydrate_g: form.carbohydrate_g ? Number(form.carbohydrate_g) : undefined,
        fat_g: form.fat_g ? Number(form.fat_g) : undefined,
        fiber_g: form.fiber_g ? Number(form.fiber_g) : undefined,
        sodium_mg: form.sodium_mg ? Number(form.sodium_mg) : undefined,
        nutrients: Object.fromEntries(OPTIONAL_MICRONUTRIENT_FIELDS.map(({ code }) => [code, numberOrNull(form.micronutrients[code])])),
      }
      if (food) await adminApi.updateFood(food.id, payload)
      else await adminApi.createFood(payload as Parameters<typeof adminApi.createFood>[0])
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

        <details className="group rounded-lg border border-border">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-foreground">
            Micronutrientes opcionales
            <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="space-y-3 border-t border-border p-3">
            <p className="text-xs text-muted">
              Deja vacío un campo si no lo conoces — se guardará como <em>desconocido</em>, no como cero. Puedes capturar <code>0</code> cuando el alimento
              realmente no contiene el nutriente.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {OPTIONAL_MICRONUTRIENT_FIELDS.map(({ code, label, unit, step }) => (
                <Input
                  key={code}
                  id={`food-${code}`}
                  label={`${label} (${unit})`}
                  type="number"
                  step={step}
                  value={form.micronutrients[code] ?? ''}
                  onChange={setMicronutrient(code)}
                />
              ))}
            </div>
          </div>
        </details>

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
