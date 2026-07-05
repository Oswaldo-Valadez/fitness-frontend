import { Coffee, Cookie, Moon, Sun } from 'lucide-react'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Desayuno',
  lunch: 'Comida',
  dinner: 'Cena',
  snack: 'Snack',
}

export const MEAL_ICONS = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
}
