import { getMealTemplates } from '@/api/generated/meal-templates/meal-templates'
import type { ApplyMealTemplateBody, CreateMealTemplateBody, MealLog, MealTemplate, UpdateMealTemplateBody } from '@/api/generated/model'

export const templatesApi = {
  async list(): Promise<MealTemplate[]> {
    const { templates } = await getMealTemplates().listMealTemplates()
    return templates ?? []
  },

  async create(payload: CreateMealTemplateBody): Promise<MealTemplate> {
    const { template } = await getMealTemplates().createMealTemplate(payload)
    return template as MealTemplate
  },

  async update(id: number, payload: UpdateMealTemplateBody): Promise<MealTemplate> {
    const { template } = await getMealTemplates().updateMealTemplate(id, payload)
    return template as MealTemplate
  },

  async remove(id: number): Promise<void> {
    await getMealTemplates().deleteMealTemplate(id)
  },

  /** Creates a real meal from a template. Returns warnings for sources that no longer exist. */
  async apply(id: number, payload: ApplyMealTemplateBody): Promise<{ meal: MealLog; warnings: string[] }> {
    const { meal, warnings } = await getMealTemplates().applyMealTemplate(id, payload)
    return { meal: meal as MealLog, warnings: warnings ?? [] }
  },

  async saveFromMeal(mealId: number, name?: string | null): Promise<MealTemplate> {
    const { template } = await getMealTemplates().saveMealAsTemplate(mealId, { name })
    return template as MealTemplate
  },
}

/** Client-generated token to protect copy/apply actions against double submit. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID()
}
