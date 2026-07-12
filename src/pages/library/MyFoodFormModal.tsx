import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { myFoodsApi } from '@/api/myFoods'
import type { Food } from '@/api/generated/model'
import { nutrientAmountOrNull } from '@/lib/nutrients'
import { OPTIONAL_MICRONUTRIENT_FIELDS } from '@/lib/nutrientReport'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import SegmentedControl from '@/components/ui/SegmentedControl'
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
  brand: string
  notes: string
  input_mode: 'per_100g' | 'per_serving'
  energy_kcal: string
  protein_g: string
  carbohydrate_g: string
  fat_g: string
  fiber_g: string
  sodium_mg: string
  serving_description: string
  serving_amount: string
  serving_unit: string
  serving_weight_g: string
  /** The 10 optional Sprint 4 micronutrients, code -> raw input string. Blank means unknown, never 0. */
  micronutrients: Record<string, string>
}

const EMPTY_MICRONUTRIENTS: Record<string, string> = Object.fromEntries(OPTIONAL_MICRONUTRIENT_FIELDS.map((f) => [f.code, '']))

const EMPTY: FormState = {
  name: '',
  category: '',
  brand: '',
  notes: '',
  input_mode: 'per_100g',
  energy_kcal: '',
  protein_g: '',
  carbohydrate_g: '',
  fat_g: '',
  fiber_g: '',
  sodium_mg: '',
  serving_description: '',
  serving_amount: '',
  serving_unit: '',
  serving_weight_g: '',
  micronutrients: EMPTY_MICRONUTRIENTS,
}

/** Empty string means "unknown" (not sent / null) — never coerced to 0. */
function numberOrUndefined(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value)
}

/** Same blank-vs-zero semantics as numberOrUndefined, but explicit null for the dynamic nutrients map (DynamicNutrientInput requires number|null, not undefined). */
function numberOrNull(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

export default function MyFoodFormModal({ open, onClose, onSaved, food }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError('')
    setForm(() => {
      if (!food) return EMPTY
      const kcal = nutrientAmountOrNull(food, 'energy_kcal')
      const protein = nutrientAmountOrNull(food, 'protein_g')
      const carbs = nutrientAmountOrNull(food, 'carbohydrate_g')
      const fat = nutrientAmountOrNull(food, 'fat_g')
      const fiber = nutrientAmountOrNull(food, 'fiber_g')
      const sodium = nutrientAmountOrNull(food, 'sodium_mg')
      const micronutrients = Object.fromEntries(
        OPTIONAL_MICRONUTRIENT_FIELDS.map(({ code }) => {
          const amount = nutrientAmountOrNull(food, code)
          return [code, amount !== null ? String(amount) : '']
        }),
      )
      return {
        ...EMPTY,
        name: food.name ?? '',
        category: food.category ?? '',
        brand: food.brand ?? '',
        energy_kcal: kcal !== null ? String(kcal) : '',
        protein_g: protein !== null ? String(protein) : '',
        carbohydrate_g: carbs !== null ? String(carbs) : '',
        fat_g: fat !== null ? String(fat) : '',
        fiber_g: fiber !== null ? String(fiber) : '',
        sodium_mg: sodium !== null ? String(sodium) : '',
        micronutrients,
      }
    })
  }, [open, food])

  const set =
    <K extends keyof Omit<FormState, 'micronutrients'>>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
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
        brand: form.brand || undefined,
        notes: form.notes || undefined,
        nutrition_basis: form.input_mode,
        nutrients: {
          energy_kcal: numberOrNull(form.energy_kcal),
          protein_g: numberOrNull(form.protein_g),
          carbohydrate_g: numberOrNull(form.carbohydrate_g),
          fat_g: numberOrNull(form.fat_g),
          fiber_g: numberOrNull(form.fiber_g),
          sodium_mg: numberOrNull(form.sodium_mg),
          ...Object.fromEntries(OPTIONAL_MICRONUTRIENT_FIELDS.map(({ code }) => [code, numberOrNull(form.micronutrients[code])])),
        },
        ...(form.input_mode === 'per_serving'
          ? {
              serving_description: form.serving_description,
              serving_amount: numberOrUndefined(form.serving_amount),
              serving_unit: form.serving_unit,
              serving_weight_g: numberOrUndefined(form.serving_weight_g),
            }
          : {}),
      }
      if (food) await myFoodsApi.update(food.id as number, payload)
      else await myFoodsApi.create(payload)
      onSaved()
    } catch {
      setError('No se pudo guardar el alimento. Revisa los campos.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={food ? 'Editar mi alimento' : 'Nuevo alimento privado'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="my-food-name" label="Nombre" value={form.name} onChange={set('name')} required />
          <Input id="my-food-category" label="Categoría" value={form.category} onChange={set('category')} />
        </div>
        <Input id="my-food-brand" label="Marca (opcional)" value={form.brand} onChange={set('brand')} />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Datos capturados</span>
          <SegmentedControl
            aria-label="Modo de captura"
            options={[
              { value: 'per_100g' as const, label: 'Por 100 g' },
              { value: 'per_serving' as const, label: 'Por porción de etiqueta' },
            ]}
            value={form.input_mode}
            onChange={(v) => setForm((f) => ({ ...f, input_mode: v }))}
            className="w-full [&>button]:flex-1"
          />
        </div>

        {form.input_mode === 'per_serving' && (
          <div className="grid gap-4 rounded-lg bg-surface-muted p-3 sm:grid-cols-2">
            <Input id="serving-description" label="Descripción de la porción" value={form.serving_description} onChange={set('serving_description')} required />
            <Input id="serving-unit" label="Unidad" value={form.serving_unit} onChange={set('serving_unit')} required />
            <Input
              id="serving-amount"
              label="Cantidad de la porción"
              type="number"
              step={0.01}
              value={form.serving_amount}
              onChange={set('serving_amount')}
              required
            />
            <Input
              id="serving-weight"
              label="Peso de la porción (g)"
              type="number"
              step={0.01}
              value={form.serving_weight_g}
              onChange={set('serving_weight_g')}
              required
            />
          </div>
        )}

        <p className="text-xs text-muted">
          Deja vacío un campo si no aparece en la etiqueta — se guardará como <em>desconocido</em>, no como cero.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Input
            id="my-food-kcal"
            label={form.input_mode === 'per_100g' ? 'Kcal/100g' : 'Kcal/porción'}
            type="number"
            step={0.1}
            value={form.energy_kcal}
            onChange={set('energy_kcal')}
          />
          <Input id="my-food-protein" label="Proteína (g)" type="number" step={0.1} value={form.protein_g} onChange={set('protein_g')} />
          <Input id="my-food-carbs" label="Carbos (g)" type="number" step={0.1} value={form.carbohydrate_g} onChange={set('carbohydrate_g')} />
          <Input id="my-food-fat" label="Grasa (g)" type="number" step={0.1} value={form.fat_g} onChange={set('fat_g')} />
          <Input id="my-food-fiber" label="Fibra (g)" type="number" step={0.1} value={form.fiber_g} onChange={set('fiber_g')} />
          <Input id="my-food-sodium" label="Sodio (mg)" type="number" step={0.1} value={form.sodium_mg} onChange={set('sodium_mg')} />
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
                  id={`my-food-${code}`}
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
