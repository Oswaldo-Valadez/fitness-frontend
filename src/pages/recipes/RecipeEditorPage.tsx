import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Search, Trash2 } from 'lucide-react'
import { foodsApi } from '@/api/foods'
import { recipesApi } from '@/api/recipes'
import type { Food, RecipeIngredientInput, RecipePreview } from '@/api/generated/model'
import { getFoodMacros } from '@/lib/nutrients'
import NutrientValue from '@/components/nutrition/NutrientValue'
import PageSpinner from '@/components/ui/PageSpinner'
import Button from '@/components/ui/Button'
import Card, { CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { useToast } from '@/components/ui/toast'

interface IngredientRow {
  key: string
  food: { id?: number; name: string }
  quantity: number
  portionId: number | null
}

export default function RecipeEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { show } = useToast()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [yieldWeight, setYieldWeight] = useState(500)
  const [servings, setServings] = useState(4)
  const [servingName, setServingName] = useState('porción')
  const [ingredients, setIngredients] = useState<IngredientRow[]>([])

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Food[]>([])
  const [preview, setPreview] = useState<RecipePreview | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    recipesApi.get(Number(id)).then((recipe) => {
      setName(recipe.name ?? '')
      setDescription(recipe.description ?? '')
      setInstructions(recipe.instructions ?? '')
      setYieldWeight(recipe.yield_weight_g ?? 500)
      setServings(recipe.default_servings ?? 4)
      setServingName(recipe.serving_name ?? 'porción')
      setIngredients(
        (recipe.ingredients ?? []).map((ing, i) => ({
          key: `existing-${i}`,
          food: { id: ing.food_id ?? undefined, name: ing.food_name },
          quantity: ing.input_quantity ?? ing.quantity_g ?? 0,
          portionId: null,
        })),
      )
      setLoading(false)
    })
  }, [id, isEdit])

  useEffect(() => {
    if (!query) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      const res = await foodsApi.search(query)
      setResults(res.data)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const addIngredient = (food: Food) => {
    setIngredients((prev) => [...prev, { key: `${food.id}-${Date.now()}`, food, quantity: 100, portionId: null }])
    setQuery('')
    setResults([])
  }

  const removeIngredient = (key: string) => {
    setIngredients((prev) => prev.filter((i) => i.key !== key))
  }

  const updateQuantity = (key: string, quantity: number) => {
    setIngredients((prev) => prev.map((i) => (i.key === key ? { ...i, quantity } : i)))
  }

  const toIngredientInputs = (): RecipeIngredientInput[] =>
    ingredients.filter((i) => i.food.id !== undefined).map((i) => ({ food_id: i.food.id as number, quantity: i.quantity, portion_id: i.portionId }))

  // Live preview, debounced.
  useEffect(() => {
    const inputs = toIngredientInputs()
    if (inputs.length === 0 || yieldWeight <= 0 || servings <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(null)
      return
    }
    setPreviewing(true)
    const t = setTimeout(async () => {
      try {
        const p = await recipesApi.preview({ yield_weight_g: yieldWeight, default_servings: servings, ingredients: inputs })
        setPreview(p)
      } catch {
        setPreview(null)
      } finally {
        setPreviewing(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [ingredients, yieldWeight, servings])

  const handleSave = async () => {
    setError('')
    if (ingredients.length === 0) {
      setError('Agrega al menos un ingrediente.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name,
        description: description || undefined,
        instructions: instructions || undefined,
        yield_weight_g: yieldWeight,
        default_servings: servings,
        serving_name: servingName,
        ingredients: toIngredientInputs(),
      }
      const recipe = isEdit ? await recipesApi.update(Number(id), payload) : await recipesApi.create(payload)
      show({ variant: 'success', message: 'Receta guardada.' })
      navigate(`/recipes/${recipe.id}`, { replace: true })
    } catch {
      setError('No se pudo guardar la receta. Revisa los campos e ingredientes.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="secondary" size="sm" iconLeft={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
        Regresar
      </Button>

      <Card elevated className="space-y-4">
        <h1 className="text-xl font-bold text-foreground">{isEdit ? 'Editar receta' : 'Nueva receta'}</h1>

        <Input id="recipe-name" label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />

        <div>
          <label htmlFor="recipe-description" className="mb-1.5 block text-sm font-medium text-foreground">
            Descripción (opcional)
          </label>
          <textarea
            id="recipe-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            id="recipe-yield"
            label="Rendimiento (g)"
            type="number"
            min={1}
            value={yieldWeight}
            onChange={(e) => setYieldWeight(Number(e.target.value))}
            required
          />
          <Input
            id="recipe-servings"
            label="Porciones"
            type="number"
            min={0.5}
            step={0.5}
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            required
          />
          <Input id="recipe-serving-name" label="Nombre de porción" value={servingName} onChange={(e) => setServingName(e.target.value)} />
        </div>

        <div>
          <label htmlFor="recipe-instructions" className="mb-1.5 block text-sm font-medium text-foreground">
            Instrucciones (opcional)
          </label>
          <textarea
            id="recipe-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </Card>

      <Card className="space-y-3">
        <CardHeader title="Ingredientes" />

        {ingredients.length > 0 && (
          <ul className="space-y-2">
            {ingredients.map((row) => (
              <li key={row.key} className="flex items-center gap-2 rounded-lg bg-surface-muted p-2.5">
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{row.food.name}</span>
                <input
                  type="number"
                  min={0.1}
                  value={row.quantity}
                  onChange={(e) => updateQuantity(row.key, Number(e.target.value))}
                  className="h-9 w-20 rounded-lg border border-border bg-surface text-center text-sm text-foreground"
                  aria-label={`Cantidad de ${row.food.name}`}
                />
                <span className="text-xs text-muted">g</span>
                <button
                  onClick={() => removeIngredient(row.key)}
                  aria-label={`Quitar ${row.food.name}`}
                  className="cursor-pointer rounded p-1.5 text-muted hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="relative">
          <Input
            id="ingredient-search"
            placeholder="Buscar alimento..."
            iconLeft={<Search className="h-4 w-4" />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-surface shadow-elevated">
              {results.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-surface-muted"
                    onClick={() => addIngredient(f)}
                  >
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Plus className="h-3.5 w-3.5 text-primary" /> {f.name}
                    </span>
                    <span className="text-xs text-muted">
                      <NutrientValue value={getFoodMacros(f).energy_kcal} unit=" kcal/100g" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {(preview || previewing) && (
        <Card className="space-y-3">
          <CardHeader title="Vista previa" subtitle={previewing ? 'Calculando…' : undefined} />
          {preview && (
            <>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <PreviewCol label="Total" energy={preview.totals?.energy_kcal} status={preview.has_incomplete_nutrients ? 'partial' : 'complete'} />
                <PreviewCol label="Por 100 g" energy={preview.per_100g?.energy_kcal} status={preview.has_incomplete_nutrients ? 'partial' : 'complete'} />
                <PreviewCol
                  label={`Por ${servingName}`}
                  energy={preview.per_serving?.energy_kcal}
                  status={preview.has_incomplete_nutrients ? 'partial' : 'complete'}
                />
              </div>
              {preview.warnings && preview.warnings.length > 0 && (
                <ul className="space-y-1 text-xs text-warning">
                  {preview.warnings.map((w) => (
                    <li key={w}>⚠ {w}</li>
                  ))}
                </ul>
              )}
              {preview.limitations && (
                <ul className="space-y-0.5 text-xs text-muted">
                  {preview.limitations.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button className="w-full" size="lg" loading={saving} onClick={handleSave}>
        {isEdit ? 'Guardar cambios' : 'Crear receta'}
      </Button>
    </div>
  )
}

function PreviewCol({ label, energy, status }: { label: string; energy?: number | null; status: 'complete' | 'partial' }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="tabular-nums text-lg font-bold text-foreground">
        <NutrientValue value={energy} status={status} unit=" kcal" />
      </p>
    </div>
  )
}
