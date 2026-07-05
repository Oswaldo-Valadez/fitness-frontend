import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Apple, ChevronLeft, ChevronRight, Search, Star } from 'lucide-react'
import { clsx } from 'clsx'
import { foodsApi } from '@/api/foods'
import { getFoodMacros } from '@/lib/nutrients'
import type { Food } from '@/api/generated/model'
import NutrientValue from '@/components/nutrition/NutrientValue'
import Input from '@/components/ui/Input'
import PageSpinner from '@/components/ui/PageSpinner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/toast'

export default function FoodsPage() {
  const { show } = useToast()
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

  useEffect(() => {
    const id = setTimeout(() => {
      search(query, category, 1)
      setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [query, category, search])

  const toggleFavorite = async (food: Food) => {
    const nowFavorite = !food.is_favorite
    setFoods((prev) => prev.map((f) => (f.id === food.id ? { ...f, is_favorite: nowFavorite } : f)))
    try {
      if (nowFavorite) await foodsApi.favorite(food.id as number)
      else await foodsApi.unfavorite(food.id as number)
      show({ variant: 'success', message: nowFavorite ? 'Agregado a favoritos.' : 'Quitado de favoritos.', duration: 2000 })
    } catch {
      // revert optimistic update on failure
      setFoods((prev) => prev.map((f) => (f.id === food.id ? { ...f, is_favorite: !nowFavorite } : f)))
    }
  }

  const goToPage = (p: number) => {
    setPage(p)
    search(query, category, p)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Catálogo de alimentos</h1>

      <div className="space-y-3">
        <Input
          id="food-search"
          placeholder="Buscar alimento..."
          iconLeft={<Search className="h-4 w-4" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategory('')}
              className={clsx(
                'shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                category === '' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
              )}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={clsx(
                  'shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  category === c ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
        <>
          {foods.length === 0 ? (
            <EmptyState icon={Apple} title="No se encontraron alimentos" description="Intenta con otro término de búsqueda o categoría." />
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="space-y-2 lg:hidden">
                {foods.map((f) => (
                  <Card key={f.id} padding="sm" className="flex items-center gap-3">
                    <Link to={`/foods/${f.id}`} className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{f.name}</p>
                      <p className="text-xs text-muted">
                        {f.category && <span>{f.category} · </span>}
                        <NutrientValue value={getFoodMacros(f).energy_kcal} unit=" kcal/100g" />
                      </p>
                    </Link>
                    <button onClick={() => toggleFavorite(f)} aria-label="Marcar como favorito" className="cursor-pointer p-1.5 text-muted hover:text-warning">
                      <Star className={clsx('h-4 w-4', f.is_favorite && 'fill-current text-warning')} />
                    </button>
                  </Card>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden overflow-hidden rounded-xl border border-border bg-surface shadow-card lg:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-surface-muted text-left text-xs font-medium uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3" />
                      <th className="px-4 py-3">Alimento</th>
                      <th className="px-4 py-3 text-right">Kcal/100g</th>
                      <th className="px-4 py-3 text-right">Proteína</th>
                      <th className="px-4 py-3 text-right">Carbos</th>
                      <th className="px-4 py-3 text-right">Grasa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {foods.map((f) => {
                      const macros = getFoodMacros(f)
                      return (
                        <tr key={f.id} className="transition-colors hover:bg-surface-muted">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleFavorite(f)}
                              aria-label="Marcar como favorito"
                              className="cursor-pointer text-muted hover:text-warning"
                            >
                              <Star className={clsx('h-4 w-4', f.is_favorite && 'fill-current text-warning')} />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <Link to={`/foods/${f.id}`} className="font-medium text-primary hover:underline">
                              {f.name}
                            </Link>
                            {f.category && <span className="ml-2 text-xs text-muted">{f.category}</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground">
                            <NutrientValue value={macros.energy_kcal} />
                          </td>
                          <td className="px-4 py-3 text-right text-protein">
                            <NutrientValue value={macros.protein_g} decimals={1} unit="g" />
                          </td>
                          <td className="px-4 py-3 text-right text-carbs">
                            <NutrientValue value={macros.carbohydrate_g} decimals={1} unit="g" />
                          </td>
                          <td className="px-4 py-3 text-right text-fat">
                            <NutrientValue value={macros.fat_g} decimals={1} unit="g" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => goToPage(page - 1)} aria-label="Página anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tabular-nums px-2 text-sm text-muted">
                {page} / {lastPage}
              </span>
              <Button variant="secondary" size="sm" disabled={page === lastPage} onClick={() => goToPage(page + 1)} aria-label="Página siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
