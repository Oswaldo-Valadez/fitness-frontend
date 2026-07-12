import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Archive, ArchiveRestore, ArrowLeft, Pencil, Star, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { recipesApi } from '@/api/recipes'
import type { NutrientStatus, NutrientTotals, Recipe } from '@/api/generated/model'
import NutrientValue from '@/components/nutrition/NutrientValue'
import { toDisplayStatus } from '@/lib/nutrientReport'
import PageSpinner from '@/components/ui/PageSpinner'
import Button from '@/components/ui/Button'
import Card, { CardHeader } from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/toast'

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { show } = useToast()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const load = () => recipesApi.get(Number(id)).then(setRecipe)

  useEffect(() => {
    if (!id) return
    load().finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageSpinner />
  if (!recipe) return <p className="py-20 text-center text-muted">Receta no encontrada.</p>

  const status = recipe.has_incomplete_nutrients ? 'partial' : 'complete'

  const toggleFavorite = async () => {
    const nowFavorite = !recipe.is_favorite
    if (nowFavorite) await recipesApi.favorite(recipe.id as number)
    else await recipesApi.unfavorite(recipe.id as number)
    setRecipe({ ...recipe, is_favorite: nowFavorite })
  }

  const toggleArchive = async () => {
    const updated = await recipesApi.toggleArchive(recipe.id as number)
    setRecipe(updated)
    show({ variant: 'success', message: updated.is_archived ? 'Receta archivada.' : 'Receta reactivada.' })
  }

  const handleDelete = async () => {
    await recipesApi.remove(recipe.id as number)
    show({ variant: 'success', message: 'Receta eliminada. Tu historial conserva los registros previos.' })
    navigate('/library/recipes', { replace: true })
  }

  const addToDiary = () => {
    navigate(`/diary?recipe_id=${recipe.id}&unit=servings&quantity=${recipe.default_servings ?? 1}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" iconLeft={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
          Regresar
        </Button>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFavorite}
            aria-label="Marcar como favorita"
            className="cursor-pointer rounded-lg border border-border bg-surface p-2 text-muted hover:text-warning"
          >
            <Star className={clsx('h-4 w-4', recipe.is_favorite && 'fill-current text-warning')} />
          </button>
          <button
            onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
            aria-label="Editar receta"
            className="cursor-pointer rounded-lg border border-border bg-surface p-2 text-muted hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={toggleArchive}
            aria-label={recipe.is_archived ? 'Reactivar receta' : 'Archivar receta'}
            className="cursor-pointer rounded-lg border border-border bg-surface p-2 text-muted hover:text-primary"
          >
            {recipe.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setConfirmingDelete(true)}
            aria-label="Eliminar receta"
            className="cursor-pointer rounded-lg border border-border bg-surface p-2 text-muted hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Card elevated className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{recipe.name}</h1>
          {recipe.description && <p className="mt-1 text-sm text-muted">{recipe.description}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-lg bg-surface-muted p-3 text-center text-sm">
          <div>
            <p className="text-xs text-muted">Total</p>
            <p className="tabular-nums text-lg font-bold text-foreground">
              <NutrientValue value={recipe.totals?.energy_kcal} status={status} unit=" kcal" />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Por 100 g</p>
            <p className="tabular-nums text-lg font-bold text-foreground">
              <NutrientValue value={recipe.per_100g?.energy_kcal} status={status} unit=" kcal" />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Por {recipe.serving_name ?? 'porción'}</p>
            <p className="tabular-nums text-lg font-bold text-foreground">
              <NutrientValue value={recipe.per_serving?.energy_kcal} status={status} unit=" kcal" />
            </p>
          </div>
        </div>

        <p className="text-xs text-muted">
          Rendimiento: {recipe.yield_weight_g} g · {recipe.default_servings} {recipe.serving_name ?? 'porciones'}
        </p>

        {recipe.limitations && recipe.limitations.length > 0 && (
          <ul className="space-y-0.5 text-xs italic text-muted">
            {recipe.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        )}

        <Button className="w-full" size="lg" disabled={recipe.is_archived} onClick={addToDiary}>
          {recipe.is_archived ? 'Receta archivada' : 'Agregar al diario'}
        </Button>
      </Card>

      <NutrientBreakdownTable recipe={recipe} />

      <Card className="space-y-3">
        <CardHeader title="Ingredientes" />
        <ul className="divide-y divide-border">
          {(recipe.ingredients ?? []).map((ing) => (
            <li key={ing.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-foreground">
                {ing.food_name}
                {!ing.food_is_available && <span className="ml-1.5 text-xs italic text-muted">(fuente eliminada)</span>}
              </span>
              <span className="text-muted">{ing.portion_description ?? `${ing.quantity_g} g`}</span>
            </li>
          ))}
        </ul>
      </Card>

      {recipe.instructions && (
        <Card className="space-y-2">
          <CardHeader title="Instrucciones" />
          <p className="whitespace-pre-line text-sm text-foreground">{recipe.instructions}</p>
        </Card>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
        title="Eliminar receta"
        description="Tu historial conservará los registros previos, pero no podrás volver a agregarla al diario."
        confirmLabel="Eliminar"
      />
    </div>
  )
}

type NutrientRow = { code: keyof NutrientTotals; label: string; unit: string; decimals: number; category: 'Energía' | 'Macronutrientes' | 'Otros' }

const BREAKDOWN_ROWS: NutrientRow[] = [
  { code: 'energy_kcal', label: 'Energía', unit: ' kcal', decimals: 0, category: 'Energía' },
  { code: 'protein_g', label: 'Proteína', unit: ' g', decimals: 1, category: 'Macronutrientes' },
  { code: 'carbohydrate_g', label: 'Carbohidratos', unit: ' g', decimals: 1, category: 'Macronutrientes' },
  { code: 'fat_g', label: 'Grasa total', unit: ' g', decimals: 1, category: 'Macronutrientes' },
  { code: 'fiber_g', label: 'Fibra', unit: ' g', decimals: 1, category: 'Otros' },
  { code: 'sodium_mg', label: 'Sodio', unit: ' mg', decimals: 0, category: 'Otros' },
]

/**
 * Grouped Por receta / Por 100g / Por porción / Status table. No reference
 * comparison here — the spec forbids it in recipe detail; comparisons only
 * appear in the personal nutrient report/detail pages. Limited to the six
 * codes the recipe contract (NutrientTotals/NutrientStatus) currently
 * exposes — the recipe endpoints have not been extended to the ten new
 * micronutrients in the vendored OpenAPI contract yet.
 */
function NutrientBreakdownTable({ recipe }: { recipe: Recipe }) {
  const categories = ['Energía', 'Macronutrientes', 'Otros'] as const

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-4 pb-0 sm:p-5 sm:pb-0">
        <CardHeader title="Desglose de nutrientes" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <caption className="sr-only">Desglose de nutrientes de {recipe.name}</caption>
          <thead className="bg-surface-muted text-left text-xs font-medium uppercase text-muted">
            <tr>
              <th className="px-4 py-2.5">Nutriente</th>
              <th className="px-4 py-2.5 text-right">Por receta</th>
              <th className="px-4 py-2.5 text-right">Por 100 g</th>
              <th className="px-4 py-2.5 text-right">Por {recipe.serving_name ?? 'porción'}</th>
              <th className="px-4 py-2.5 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((category) => (
              <RowsForCategory key={category} category={category} recipe={recipe} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function RowsForCategory({ category, recipe }: { category: NutrientRow['category']; recipe: Recipe }) {
  const rows = BREAKDOWN_ROWS.filter((r) => r.category === category)
  return (
    <>
      <tr>
        <th colSpan={5} scope="rowgroup" className="bg-surface-muted/50 px-4 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">
          {category}
        </th>
      </tr>
      {rows.map((row) => {
        const rowStatus = toDisplayStatus((recipe.nutrient_status as NutrientStatus | null)?.[row.code as keyof NutrientStatus])
        return (
          <tr key={row.code}>
            <td className="px-4 py-2.5 text-foreground">{row.label}</td>
            <td className="tabular-nums px-4 py-2.5 text-right">
              <NutrientValue value={recipe.totals?.[row.code]} status={rowStatus} unit={row.unit} decimals={row.decimals} />
            </td>
            <td className="tabular-nums px-4 py-2.5 text-right">
              <NutrientValue value={recipe.per_100g?.[row.code]} status={rowStatus} unit={row.unit} decimals={row.decimals} />
            </td>
            <td className="tabular-nums px-4 py-2.5 text-right">
              <NutrientValue value={recipe.per_serving?.[row.code]} status={rowStatus} unit={row.unit} decimals={row.decimals} />
            </td>
            <td className="px-4 py-2.5 text-right text-xs text-muted capitalize">{rowStatus}</td>
          </tr>
        )
      })}
    </>
  )
}
