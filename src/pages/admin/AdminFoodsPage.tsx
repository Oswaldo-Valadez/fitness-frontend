import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, FileSpreadsheet, Pencil, Plus, Search, Trash2, UploadCloud } from 'lucide-react'
import { type Food, type FoodSource, type ImportSummary, adminApi } from '@/api/admin'
import { getFoodMacros } from '@/lib/nutrients'
import NutrientValue from '@/components/nutrition/NutrientValue'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import PageSpinner from '@/components/ui/PageSpinner'
import Card, { CardHeader } from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/toast'
import FoodFormModal from './FoodFormModal'

type ImportStep = 'idle' | 'ready' | 'preview' | 'result'

export default function AdminFoodsPage() {
  const { show } = useToast()
  const [foods, setFoods] = useState<Food[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [sources, setSources] = useState<FoodSource[]>([])
  const [sourceId, setSourceId] = useState('')
  const [updateExisting, setUpdateExisting] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<{ summary: ImportSummary; errors: Record<string, string> } | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ message: string; summary: ImportSummary; errors: Record<string, string> } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingFood, setEditingFood] = useState<Food | null>(null)
  const [deletingFood, setDeletingFood] = useState<Food | null>(null)

  const step: ImportStep = importResult ? 'result' : preview ? 'preview' : csvFile ? 'ready' : 'idle'

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true)
    try {
      const res = await adminApi.listFoods(q, p)
      setFoods(res.data)
      setLastPage(res.meta.last_page)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      load(query, 1)
      setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [query, load])

  useEffect(() => {
    adminApi.sources().then(setSources)
  }, [])

  const resetImport = () => {
    setCsvFile(null)
    setPreview(null)
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setCsvFile(file)
      setPreview(null)
      setImportResult(null)
    }
  }

  const handlePreview = async () => {
    if (!csvFile || !sourceId) return
    setImporting(true)
    try {
      setPreview(await adminApi.importPreview(csvFile, Number(sourceId)))
    } finally {
      setImporting(false)
    }
  }

  const handleCommit = async () => {
    if (!csvFile || !sourceId) return
    setImporting(true)
    try {
      const res = await adminApi.importCommit(csvFile, Number(sourceId), updateExisting)
      setImportResult(res)
      load(query, 1)
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingFood) return
    await adminApi.deleteFood(deletingFood.id)
    show({ variant: 'success', message: `${deletingFood.name} eliminado.` })
    load(query, page)
  }

  const goToPage = (p: number) => {
    setPage(p)
    load(query, p)
  }

  const errorEntries = (errors: Record<string, string>) => Object.entries(errors).slice(0, 10)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Admin — Alimentos</h1>
        <Button
          size="sm"
          iconLeft={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingFood(null)
            setFormOpen(true)
          }}
        >
          Nuevo alimento
        </Button>
      </div>

      {/* CSV Import wizard */}
      <Card>
        <CardHeader title="Importar CSV" subtitle="Sube un archivo para agregar o actualizar alimentos en lote." />

        {step !== 'result' && (
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <Select id="import-source" label="Fuente" value={sourceId} onChange={(e) => setSourceId(e.target.value)} required>
              <option value="" disabled>
                Selecciona una fuente
              </option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              Actualizar alimentos existentes
            </label>
          </div>
        )}

        {step === 'idle' && (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-muted'
            }`}
          >
            <UploadCloud className="h-8 w-8 text-muted" />
            <p className="text-sm font-medium text-foreground">Arrastra tu archivo CSV aquí</p>
            <p className="text-xs text-muted">o haz clic para seleccionarlo</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                setCsvFile(f)
              }}
            />
          </div>
        )}

        {step === 'ready' && csvFile && (
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <span className="flex items-center gap-2 text-sm text-foreground">
              <FileSpreadsheet className="h-5 w-5 text-primary" /> {csvFile.name}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={resetImport}>
                Cambiar archivo
              </Button>
              <Button size="sm" loading={importing} disabled={!sourceId} onClick={handlePreview}>
                Ver vista previa
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              <strong>{preview.summary.valid}</strong> filas válidas de <strong>{preview.summary.total}</strong> ·{' '}
              <strong className="text-destructive">{preview.summary.invalid}</strong> errores
            </p>
            {errorEntries(preview.errors).length > 0 && (
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg bg-destructive/5 p-3">
                {errorEntries(preview.errors).map(([line, message]) => (
                  <p key={line} className="text-xs text-destructive">
                    Fila {line}: {message}
                  </p>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={resetImport}>
                Cancelar
              </Button>
              <Button size="sm" loading={importing} disabled={preview.summary.valid === 0} onClick={handleCommit}>
                Importar {preview.summary.valid} alimentos
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-accent/10 p-3 text-sm text-accent">
              <CheckCircle2 className="h-4 w-4" />
              Creados: {importResult.summary.inserted} · Actualizados: {importResult.summary.updated} · Omitidos: {importResult.summary.skipped} · Errores:{' '}
              {importResult.summary.invalid}
            </div>
            <Button variant="secondary" size="sm" onClick={resetImport}>
              Importar otro archivo
            </Button>
          </div>
        )}
      </Card>

      {/* Lista de alimentos */}
      <section className="space-y-4">
        <Input id="admin-search" placeholder="Buscar..." iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} />

        {loading ? (
          <PageSpinner />
        ) : foods.length === 0 ? (
          <EmptyState icon={FileSpreadsheet} title="Sin alimentos" description="Crea uno nuevo o impórtalos desde un CSV." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-muted text-left text-xs font-medium uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3 text-right">Kcal/100g</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {foods.map((f) => (
                  <tr key={f.id} className="hover:bg-surface-muted">
                    <td className="px-4 py-3 font-medium text-foreground">{f.name}</td>
                    <td className="px-4 py-3 text-muted">{f.category ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-foreground">
                      <NutrientValue value={getFoodMacros(f).energy_kcal} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingFood(f)
                            setFormOpen(true)
                          }}
                          aria-label={`Editar ${f.name}`}
                          className="cursor-pointer rounded p-1.5 text-muted hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingFood(f)}
                          aria-label={`Eliminar ${f.name}`}
                          className="cursor-pointer rounded p-1.5 text-muted hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => goToPage(page - 1)}>
              Anterior
            </Button>
            <span className="tabular-nums px-3 py-2 text-sm text-muted">
              {page} / {lastPage}
            </span>
            <Button variant="secondary" size="sm" disabled={page === lastPage} onClick={() => goToPage(page + 1)}>
              Siguiente
            </Button>
          </div>
        )}
      </section>

      <FoodFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        food={editingFood}
        onSaved={() => {
          setFormOpen(false)
          load(query, page)
          show({ variant: 'success', message: 'Alimento guardado.' })
        }}
      />

      <ConfirmDialog
        open={!!deletingFood}
        onClose={() => setDeletingFood(null)}
        onConfirm={handleDelete}
        title="Eliminar alimento"
        description={`¿Seguro que quieres eliminar "${deletingFood?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </div>
  )
}
