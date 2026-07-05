import { useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { templatesApi } from '@/api/templates'
import { unifiedSearchApi } from '@/api/foods'
import type { CreateMealTemplateBodyItemsItem, Food, MealLogMealType, Recipe } from '@/api/generated/model'
import { MEAL_LABELS, MEAL_TYPES } from '@/lib/mealTypes'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

interface TemplateItemRow {
  key: string
  sourceKind: 'food' | 'recipe'
  id: number
  name: string
  quantityG: number
}

export default function TemplateFormModal({ open, onClose, onSaved }: Props) {
  const [name, setName] = useState('')
  const [mealType, setMealType] = useState<MealLogMealType>('breakfast')
  const [items, setItems] = useState<TemplateItemRow[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ foods: Food[]; recipes: Recipe[] }>({ foods: [], recipes: [] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const search = async (q: string) => {
    setQuery(q)
    if (!q) {
      setResults({ foods: [], recipes: [] })
      return
    }
    const res = await unifiedSearchApi.search(q)
    setResults({ foods: [...(res.foods ?? []), ...(res.my_foods ?? [])], recipes: res.recipes ?? [] })
  }

  const addItem = (kind: 'food' | 'recipe', id: number, itemName: string) => {
    setItems((prev) => [...prev, { key: `${kind}-${id}-${Date.now()}`, sourceKind: kind, id, name: itemName, quantityG: 100 }])
    setQuery('')
    setResults({ foods: [], recipes: [] })
  }

  const removeItem = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key))
  const updateItemQuantity = (key: string, quantityG: number) => setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantityG } : i)))

  const reset = () => {
    setName('')
    setMealType('breakfast')
    setItems([])
    setQuery('')
    setResults({ foods: [], recipes: [] })
    setError('')
  }

  const handleSave = async () => {
    setError('')
    if (items.length === 0) {
      setError('Agrega al menos un elemento a la plantilla.')
      return
    }
    setSaving(true)
    try {
      const payloadItems: CreateMealTemplateBodyItemsItem[] = items.map((i) => ({
        source_kind: i.sourceKind,
        food_id: i.sourceKind === 'food' ? i.id : null,
        recipe_id: i.sourceKind === 'recipe' ? i.id : null,
        quantity_g: i.quantityG,
      }))
      await templatesApi.create({ name, default_meal_type: mealType, items: payloadItems })
      reset()
      onSaved()
    } catch {
      setError('No se pudo guardar la plantilla. Revisa los elementos.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Nueva plantilla"
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="template-name" label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
          <Select id="template-meal-type" label="Comida por defecto" value={mealType} onChange={(e) => setMealType(e.target.value as MealLogMealType)}>
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {MEAL_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>

        {items.length > 0 && (
          <ul className="space-y-2">
            {items.map((row) => (
              <li key={row.key} className="flex items-center gap-2 rounded-lg bg-surface-muted p-2.5">
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {row.name} <span className="text-xs text-muted">({row.sourceKind === 'recipe' ? 'receta' : 'alimento'})</span>
                </span>
                <input
                  type="number"
                  min={1}
                  value={row.quantityG}
                  onChange={(e) => updateItemQuantity(row.key, Number(e.target.value))}
                  className="h-9 w-20 rounded-lg border border-border bg-surface text-center text-sm text-foreground"
                  aria-label={`Cantidad de ${row.name}`}
                />
                <span className="text-xs text-muted">g</span>
                <button
                  onClick={() => removeItem(row.key)}
                  aria-label={`Quitar ${row.name}`}
                  className="cursor-pointer rounded p-1.5 text-muted hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="relative">
          <Input
            id="template-item-search"
            placeholder="Buscar alimento o receta..."
            iconLeft={<Search className="h-4 w-4" />}
            value={query}
            onChange={(e) => search(e.target.value)}
          />
          {(results.foods.length > 0 || results.recipes.length > 0) && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-surface shadow-elevated">
              {results.foods.map((f) => (
                <li key={`food-${f.id}`}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-1.5 px-4 py-2.5 text-left text-sm hover:bg-surface-muted"
                    onClick={() => addItem('food', f.id as number, f.name as string)}
                  >
                    <Plus className="h-3.5 w-3.5 text-primary" /> {f.name}
                  </button>
                </li>
              ))}
              {results.recipes.map((r) => (
                <li key={`recipe-${r.id}`}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-1.5 px-4 py-2.5 text-left text-sm hover:bg-surface-muted"
                    onClick={() => addItem('recipe', r.id as number, r.name as string)}
                  >
                    <Plus className="h-3.5 w-3.5 text-primary" /> {r.name} <span className="text-xs text-muted">(receta)</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Crear plantilla
          </Button>
        </div>
      </div>
    </Modal>
  )
}
