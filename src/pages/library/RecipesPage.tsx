import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChefHat, Plus, Star } from 'lucide-react'
import { clsx } from 'clsx'
import { recipesApi } from '@/api/recipes'
import type { Recipe } from '@/api/generated/model'
import NutrientValue from '@/components/nutrition/NutrientValue'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import PageSpinner from '@/components/ui/PageSpinner'
import { useToast } from '@/components/ui/toast'

export default function RecipesPage() {
  const { show } = useToast()
  const navigate = useNavigate()
  const [archived, setArchived] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[] | null>(null)

  const load = () => recipesApi.list(archived).then((res) => setRecipes(res.data))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecipes(null)
    load()
  }, [archived])

  const toggleFavorite = async (recipe: Recipe) => {
    const nowFavorite = !recipe.is_favorite
    try {
      if (nowFavorite) await recipesApi.favorite(recipe.id as number)
      else await recipesApi.unfavorite(recipe.id as number)
      setRecipes((prev) => prev?.map((r) => (r.id === recipe.id ? { ...r, is_favorite: nowFavorite } : r)) ?? null)
    } catch {
      show({ variant: 'error', message: 'No se pudo actualizar el favorito.' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setArchived(false)}
            className={clsx(
              'cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              !archived ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
            )}
          >
            Activas
          </button>
          <button
            onClick={() => setArchived(true)}
            className={clsx(
              'cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              archived ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-muted',
            )}
          >
            Archivadas
          </button>
        </div>
        <Button size="sm" iconLeft={<Plus className="h-4 w-4" />} onClick={() => navigate('/recipes/new')}>
          Nueva
        </Button>
      </div>

      {!recipes ? (
        <PageSpinner />
      ) : recipes.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title={archived ? 'Sin recetas archivadas' : 'Sin recetas'}
          description={archived ? undefined : 'Crea recetas reutilizables combinando alimentos e ingredientes.'}
          action={
            !archived ? (
              <Button size="sm" onClick={() => navigate('/recipes/new')}>
                Crear la primera
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {recipes.map((r) => (
            <Card key={r.id} padding="sm" className="flex items-center gap-3">
              <Link to={`/recipes/${r.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{r.name}</p>
                <p className="text-xs text-muted">
                  <NutrientValue value={r.totals?.energy_kcal} status={r.has_incomplete_nutrients ? 'partial' : 'complete'} unit=" kcal total" />
                </p>
              </Link>
              <button onClick={() => toggleFavorite(r)} aria-label="Marcar como favorita" className="cursor-pointer p-1.5 text-muted hover:text-warning">
                <Star className={clsx('h-4 w-4', r.is_favorite && 'fill-current text-warning')} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
