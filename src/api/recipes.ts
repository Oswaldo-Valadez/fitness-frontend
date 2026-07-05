import { getRecipes } from '@/api/generated/recipes/recipes'
import type { PaginationMeta, PreviewRecipeBody, Recipe, RecipeInput, RecipePreview, UpdateRecipeBody } from '@/api/generated/model'

export const recipesApi = {
  async list(archived = false): Promise<{ data: Recipe[]; meta: PaginationMeta }> {
    const { data, meta } = await getRecipes().listRecipes({ archived })
    return { data: data ?? [], meta: meta as PaginationMeta }
  },

  async get(id: number): Promise<Recipe> {
    const { recipe } = await getRecipes().getRecipe(id)
    return recipe as Recipe
  },

  async create(payload: RecipeInput): Promise<Recipe> {
    const { recipe } = await getRecipes().createRecipe(payload)
    return recipe as Recipe
  },

  async update(id: number, payload: UpdateRecipeBody): Promise<Recipe> {
    const { recipe } = await getRecipes().updateRecipe(id, payload)
    return recipe as Recipe
  },

  async remove(id: number): Promise<void> {
    await getRecipes().deleteRecipe(id)
  },

  async toggleArchive(id: number): Promise<Recipe> {
    const { recipe } = await getRecipes().archiveRecipe(id)
    return recipe as Recipe
  },

  async favorite(id: number): Promise<void> {
    await getRecipes().favoriteRecipe(id)
  },

  async unfavorite(id: number): Promise<void> {
    await getRecipes().unfavoriteRecipe(id)
  },

  async preview(payload: PreviewRecipeBody): Promise<RecipePreview> {
    return getRecipes().previewRecipe(payload)
  },
}
