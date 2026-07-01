import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { foodsApi } from '@/api/foods'
import type { Food } from '@/types/models'
import PageSpinner from '@/components/ui/PageSpinner'
import Button from '@/components/ui/Button'

const ROW = (label: string, value: string) => (
  <div className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
)

export default function FoodDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [food, setFood] = useState<Food | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    foodsApi.get(Number(id)).then(setFood).finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageSpinner />
  if (!food) return <p className="text-center text-gray-400 py-20">Alimento no encontrado.</p>

  return (
    <div className="max-w-md mx-auto space-y-5">
      <Button variant="secondary" onClick={() => navigate(-1)}>← Regresar</Button>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{food.name}</h1>
        {food.category && <span className="text-xs text-gray-400">{food.category}</span>}

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Información nutricional por 100g</p>
          {ROW('Energía', `${Number(food.energy_kcal_per_100g).toFixed(1)} kcal`)}
          {ROW('Proteína', `${Number(food.protein_g_per_100g).toFixed(2)} g`)}
          {ROW('Carbohidratos', `${Number(food.carbohydrate_g_per_100g).toFixed(2)} g`)}
          {ROW('Grasa total', `${Number(food.fat_g_per_100g).toFixed(2)} g`)}
          {food.fiber_g_per_100g && ROW('Fibra', `${Number(food.fiber_g_per_100g).toFixed(2)} g`)}
          {food.sodium_mg_per_100g && ROW('Sodio', `${Number(food.sodium_mg_per_100g).toFixed(1)} mg`)}
        </div>

        <Button className="mt-6 w-full" onClick={() => navigate(`/diary?food_id=${food.id}`)}>
          Agregar al diario
        </Button>
      </div>
    </div>
  )
}
