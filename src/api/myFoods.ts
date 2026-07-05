import { getMyFoods } from '@/api/generated/my-foods/my-foods'
import type { CreateMyFoodBody, DeleteMyFood200Result, Food, PaginationMeta, UpdateMyFoodBody } from '@/api/generated/model'

export const myFoodsApi = {
  async list(): Promise<{ data: Food[]; meta: PaginationMeta }> {
    const { data, meta } = await getMyFoods().listMyFoods()
    return { data: data ?? [], meta: meta as PaginationMeta }
  },

  async create(payload: CreateMyFoodBody): Promise<Food> {
    const { food } = await getMyFoods().createMyFood(payload)
    return food as Food
  },

  async update(id: number, payload: UpdateMyFoodBody): Promise<Food> {
    const { food } = await getMyFoods().updateMyFood(id, payload)
    return food as Food
  },

  async remove(id: number): Promise<DeleteMyFood200Result> {
    const { result } = await getMyFoods().deleteMyFood(id)
    return result as DeleteMyFood200Result
  },
}
