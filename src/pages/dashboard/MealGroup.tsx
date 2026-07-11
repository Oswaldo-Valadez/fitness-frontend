import { Copy, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { MEAL_ICONS, MEAL_LABELS, type MealType } from '@/lib/mealTypes'
import type { NutrientStatusValue } from '@/lib/nutrientStatus'
import NutrientValue from '@/components/nutrition/NutrientValue'

export interface MealGroupItem {
  id?: number
  food_name?: string
  quantity_g?: number
  energy_kcal?: number | null
  nutrient_status?: { energy_kcal?: NutrientStatusValue | null } | null
}

export interface MealGroupMeal {
  id?: number
  name?: string | null
  items?: MealGroupItem[]
  /** When the caller already has an honest (null-safe) aggregate, pass it
   * instead of letting this component re-sum items client-side. */
  totals?: { energy_kcal?: number | null } | null
}

interface Props {
  mealType: MealType
  meal: MealGroupMeal | null
  onAddMeal: () => void
  onDeleteItem?: (item: MealGroupItem) => void
  /** Both are only offered once the meal actually has items. */
  onSaveAsTemplate?: () => void
  onCopyToDate?: () => void
  onEdit?: () => void
}

/** Sums only items with a known energy value — never treats unknown as 0. */
function summarizeEnergy(items: MealGroupItem[]): { value: number | null; status: NutrientStatusValue } {
  if (items.length === 0) return { value: 0, status: 'complete' }

  const known = items.filter((item) => item.energy_kcal !== null)
  if (known.length === 0) return { value: null, status: 'unknown' }

  const sum = known.reduce((acc, item) => acc + (item.energy_kcal ?? 0), 0)
  return { value: sum, status: known.length < items.length ? 'partial' : 'complete' }
}

export default function MealGroup({ mealType, meal, onAddMeal, onDeleteItem, onSaveAsTemplate, onCopyToDate, onEdit }: Props) {
  const Icon = MEAL_ICONS[mealType]
  const items = meal?.items ?? []
  const fallback = summarizeEnergy(items)
  const totalValue = meal?.totals ? (meal.totals.energy_kcal ?? null) : fallback.value
  const totalStatus = meal?.totals ? undefined : fallback.status

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          {meal?.name || MEAL_LABELS[mealType]}
        </h3>
        {meal && (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-muted">
              <NutrientValue value={totalValue} status={totalStatus} unit=" kcal" />
            </span>
            {onEdit && (
              <button onClick={onEdit} aria-label="Editar comida" title="Editar comida" className="cursor-pointer rounded p-1 text-muted hover:text-primary">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {items.length > 0 && onCopyToDate && (
              <button
                onClick={onCopyToDate}
                aria-label="Copiar a otra fecha"
                title="Copiar a otra fecha"
                className="cursor-pointer rounded p-1 text-muted hover:text-primary"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
            {items.length > 0 && onSaveAsTemplate && (
              <button
                onClick={onSaveAsTemplate}
                aria-label="Guardar como plantilla"
                title="Guardar como plantilla"
                className="cursor-pointer rounded p-1 text-muted hover:text-primary"
              >
                <Save className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <button
          onClick={onAddMeal}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border py-4 text-sm text-muted transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Plus className="h-4 w-4" /> Agregar {MEAL_LABELS[mealType].toLowerCase()}
        </button>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} className="group flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-sm">
              <span className="min-w-0 flex-1 truncate text-foreground">
                {item.food_name} <span className="text-muted">{item.quantity_g}g</span>
              </span>
              <span className="shrink-0 text-muted">
                <NutrientValue value={item.energy_kcal} status={item.nutrient_status?.energy_kcal} unit=" kcal" />
              </span>
              {onDeleteItem && (
                <button
                  onClick={() => onDeleteItem(item)}
                  aria-label={`Eliminar ${item.food_name}`}
                  className="shrink-0 cursor-pointer rounded p-1 text-muted opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
          <li className="pt-2">
            <button onClick={onAddMeal} className="flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline">
              <Plus className="h-3 w-3" /> Agregar alimento
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
