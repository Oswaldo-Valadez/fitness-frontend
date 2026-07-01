import type { MealLog } from '@/types/models'

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Comida',
  dinner: 'Cena',
  snack: 'Snack',
}

interface Props {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  meal: MealLog | null
  date: string
  onUpdated: () => void
  onAddMeal: () => void
}

export default function MealGroup({ mealType, meal, onAddMeal }: Props) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">{MEAL_LABELS[mealType]}</h3>
        {meal && (
          <span className="text-sm text-gray-500">
            {Math.round(meal.total_energy_kcal ?? 0)} kcal
          </span>
        )}
      </div>

      {!meal ? (
        <button
          onClick={onAddMeal}
          className="w-full rounded-lg border-2 border-dashed border-gray-200 py-4 text-sm text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
        >
          + Agregar {MEAL_LABELS[mealType].toLowerCase()}
        </button>
      ) : (
        <ul className="space-y-1">
          {(meal.items ?? []).map((item) => (
            <li key={item.id} className="flex justify-between text-sm text-gray-700">
              <span>{item.food_name} <span className="text-gray-400">{item.quantity_g}g</span></span>
              <span className="text-gray-500">{Math.round(Number(item.energy_kcal))} kcal</span>
            </li>
          ))}
          <li className="pt-2">
            <button
              onClick={onAddMeal}
              className="text-xs text-emerald-600 hover:underline"
            >
              + Agregar alimento
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
