import { useEffect, useState } from 'react'
import { ClipboardList, Plus, Star, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { templatesApi } from '@/api/templates'
import type { MealTemplate } from '@/api/generated/model'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import PageSpinner from '@/components/ui/PageSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/toast'
import TemplateFormModal from './TemplateFormModal'
import ApplyTemplateModal from './ApplyTemplateModal'

export default function TemplatesPage() {
  const { show } = useToast()
  const [templates, setTemplates] = useState<MealTemplate[] | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [applying, setApplying] = useState<MealTemplate | null>(null)
  const [deleting, setDeleting] = useState<MealTemplate | null>(null)

  const load = () => templatesApi.list().then(setTemplates)

  useEffect(() => {
    load()
  }, [])

  const toggleFavorite = async (template: MealTemplate) => {
    const nowFavorite = !template.is_favorite
    setTemplates((prev) => prev?.map((t) => (t.id === template.id ? { ...t, is_favorite: nowFavorite } : t)) ?? null)
    try {
      await templatesApi.update(template.id as number, { is_favorite: nowFavorite })
    } catch {
      setTemplates((prev) => prev?.map((t) => (t.id === template.id ? { ...t, is_favorite: !nowFavorite } : t)) ?? null)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    await templatesApi.remove(deleting.id as number)
    show({ variant: 'success', message: 'Plantilla eliminada.' })
    load()
  }

  if (!templates) return <PageSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Combos reutilizables para registrar rápido.</p>
        <Button size="sm" iconLeft={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
          Nueva
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin plantillas"
          description="Crea plantillas con tus combinaciones frecuentes, o guarda una comida del diario como plantilla."
          action={
            <Button size="sm" onClick={() => setFormOpen(true)}>
              Crear la primera
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <Card key={t.id} padding="sm" className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted">{t.items?.length ?? 0} elementos</p>
              </div>
              <button onClick={() => toggleFavorite(t)} aria-label="Marcar como favorita" className="cursor-pointer p-1.5 text-muted hover:text-warning">
                <Star className={clsx('h-4 w-4', t.is_favorite && 'fill-current text-warning')} />
              </button>
              <Button size="sm" variant="secondary" onClick={() => setApplying(t)}>
                Aplicar
              </Button>
              <button
                onClick={() => setDeleting(t)}
                aria-label={`Eliminar ${t.name}`}
                className="cursor-pointer rounded p-1.5 text-muted hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <TemplateFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          load()
          show({ variant: 'success', message: 'Plantilla creada.' })
        }}
      />

      <ApplyTemplateModal template={applying} onClose={() => setApplying(null)} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar plantilla"
        description={`¿Seguro que quieres eliminar "${deleting?.name}"?`}
        confirmLabel="Eliminar"
      />
    </div>
  )
}
