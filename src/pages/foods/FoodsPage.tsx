import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { foodsApi } from '@/api/foods'
import type { Food } from '@/types/models'
import Input from '@/components/ui/Input'
import PageSpinner from '@/components/ui/PageSpinner'
import Button from '@/components/ui/Button'

export default function FoodsPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [foods, setFoods] = useState<Food[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    foodsApi.categories().then(setCategories)
  }, [])

  const search = useCallback(async (q: string, cat: string, p: number) => {
    setLoading(true)
    try {
      const res = await foodsApi.search(q, cat || undefined, p)
      setFoods(res.data)
      setLastPage(res.meta.last_page)
    } finally {
      setLoading(false)
    }
  }, [])

  // Búsqueda con debounce de 300ms
  useEffect(() => {
    const id = setTimeout(() => { search(query, category, 1); setPage(1) }, 300)
    return () => clearTimeout(id)
  }, [query, category, search])

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Catálogo de alimentos</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          id="food-search"
          placeholder="Buscar alimento..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <PageSpinner /> : (
        <>
          {foods.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No se encontraron alimentos.</p>
          ) : (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Alimento</th>
                    <th className="px-4 py-3 text-right">Kcal/100g</th>
                    <th className="px-4 py-3 text-right">Proteína</th>
                    <th className="px-4 py-3 text-right">Carbos</th>
                    <th className="px-4 py-3 text-right">Grasa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {foods.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/foods/${f.id}`} className="font-medium text-emerald-700 hover:underline">
                          {f.name}
                        </Link>
                        {f.category && <span className="ml-2 text-xs text-gray-400">{f.category}</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{Number(f.energy_kcal_per_100g).toFixed(0)}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{Number(f.protein_g_per_100g).toFixed(1)}g</td>
                      <td className="px-4 py-3 text-right text-amber-600">{Number(f.carbohydrate_g_per_100g).toFixed(1)}g</td>
                      <td className="px-4 py-3 text-right text-rose-600">{Number(f.fat_g_per_100g).toFixed(1)}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {lastPage > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="secondary" disabled={page === 1}
                onClick={() => { const p = page - 1; setPage(p); search(query, category, p) }}>
                Anterior
              </Button>
              <span className="px-3 py-2 text-sm text-gray-600">{page} / {lastPage}</span>
              <Button variant="secondary" disabled={page === lastPage}
                onClick={() => { const p = page + 1; setPage(p); search(query, category, p) }}>
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
