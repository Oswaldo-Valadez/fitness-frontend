import { Plus, Trash2 } from 'lucide-react'
import type { MealLog, MealLogItem } from '@/types/models'
import { MEAL_ICONS, MEAL_LABELS, type MealType } from '@/lib/mealTypes'

interface Props {
  mealType: MealType
  meal: MealLog | null
  onAddMeal: () => void
  onDeleteItem?: (item: MealLogItem) => void
}

export default function MealGroup({ mealType, meal, onAddMeal, onDeleteItem }: Props) {
  const Icon = MEAL_ICONS[mealType]
  const items = meal?.items ?? []

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          {MEAL_LABELS[mealType]}
        </h3>
        {meal && (
          <span className="tabular-nums text-sm font-medium text-muted">{Math.round(items.reduce((sum, item) => sum + Number(item.energy_kcal), 0))} kcal</span>
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
              <span className="tabular-nums shrink-0 text-muted">{Math.round(Number(item.energy_kcal))} kcal</span>
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
