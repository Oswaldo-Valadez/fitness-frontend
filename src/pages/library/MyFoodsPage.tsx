import { useEffect, useState } from 'react'
import { Apple, Pencil, Plus, Trash2 } from 'lucide-react'
import { myFoodsApi } from '@/api/myFoods'
import type { Food } from '@/api/generated/model'
import { getFoodMacros } from '@/lib/nutrients'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import PageSpinner from '@/components/ui/PageSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/toast'
import MyFoodFormModal from './MyFoodFormModal'

export default function MyFoodsPage() {
  const { show } = useToast()
  const [foods, setFoods] = useState<Food[] | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingFood, setEditingFood] = useState<Food | null>(null)
  const [deletingFood, setDeletingFood] = useState<Food | null>(null)

  const load = () => myFoodsApi.list().then((res) => setFoods(res.data))

  useEffect(() => {
    load()
  }, [])

  const handleSaved = () => {
    setFormOpen(false)
    setEditingFood(null)
    load()
    show({ variant: 'success', message: 'Alimento guardado.' })
  }

  const handleDelete = async () => {
    if (!deletingFood) return
    const result = await myFoodsApi.remove(deletingFood.id as number)
    show({
      variant: 'success',
      message: result === 'deleted' ? 'Alimento eliminado.' : 'El alimento está en uso en tu historial; se desactivó para conservar los registros.',
    })
    load()
  }

  if (!foods) return <PageSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Alimentos que solo tú puedes ver y usar.</p>
        <Button
          size="sm"
          iconLeft={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingFood(null)
            setFormOpen(true)
          }}
        >
          Nuevo
        </Button>
      </div>

      {foods.length === 0 ? (
        <EmptyState
          icon={Apple}
          title="Sin alimentos privados"
          description="Crea alimentos que no estén en el catálogo público — solo tú los verás."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditingFood(null)
                setFormOpen(true)
              }}
            >
              Crear el primero
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {foods.map((f) => {
            const macros = getFoodMacros(f)
            return (
              <Card key={f.id} padding="sm" className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-foreground">{f.name}</p>
                    {f.data_quality_status && f.data_quality_status !== 'complete' && (
                      <Badge variant="warning" size="sm">
                        {f.data_quality_status === 'partial' ? 'Datos parciales' : 'Datos desconocidos'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {f.category && <span>{f.category} · </span>}
                    {macros.energy_kcal.toFixed(0)} kcal/100g
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingFood(f)
                    setFormOpen(true)
                  }}
                  aria-label={`Editar ${f.name}`}
                  className="cursor-pointer rounded p-1.5 text-muted hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeletingFood(f)}
                  aria-label={`Eliminar ${f.name}`}
                  className="cursor-pointer rounded p-1.5 text-muted hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            )
          })}
        </div>
      )}

      <MyFoodFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingFood(null)
        }}
        onSaved={handleSaved}
        food={editingFood}
      />

      <ConfirmDialog
        open={!!deletingFood}
        onClose={() => setDeletingFood(null)}
        onConfirm={handleDelete}
        title="Eliminar alimento"
        description={`¿Seguro que quieres eliminar "${deletingFood?.name}"? Si está en uso en tu historial, se desactivará en vez de borrarse.`}
        confirmLabel="Eliminar"
      />
    </div>
  )
}
