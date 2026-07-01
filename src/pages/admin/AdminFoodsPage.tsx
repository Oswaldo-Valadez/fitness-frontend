import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '@/api/admin'
import type { Food } from '@/types/models'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PageSpinner from '@/components/ui/PageSpinner'

export default function AdminFoodsPage() {
  const [foods, setFoods] = useState<Food[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // CSV import
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ rows: unknown[]; errors: unknown[] } | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string>('')

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
    const id = setTimeout(() => { load(query, 1); setPage(1) }, 300)
    return () => clearTimeout(id)
  }, [query, load])

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este alimento?')) return
    await adminApi.deleteFood(id)
    load(query, page)
  }

  const handlePreview = async () => {
    if (!csvFile) return
    setImporting(true)
    try {
      const res = await adminApi.importPreview(csvFile)
      setPreview(res)
    } finally {
      setImporting(false)
    }
  }

  const handleCommit = async () => {
    if (!csvFile) return
    setImporting(true)
    try {
      const res = await adminApi.importCommit(csvFile)
      setImportResult(`Importados: ${res.imported}, actualizados: ${res.updated}, errores: ${(res.errors as unknown[]).length}`)
      setPreview(null)
      setCsvFile(null)
      load(query, 1)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin — Alimentos</h1>

      {/* CSV Import */}
      <section className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800">Importar CSV</h2>
        <div className="flex items-center gap-3">
          <input type="file" accept=".csv"
            onChange={(e) => { setCsvFile(e.target.files?.[0] ?? null); setPreview(null); setImportResult('') }}
            className="text-sm text-gray-600" />
          <Button variant="secondary" disabled={!csvFile} loading={importing} onClick={handlePreview}>
            Vista previa
          </Button>
        </div>

        {importResult && (
          <p className="text-sm text-emerald-700 bg-emerald-50 rounded px-3 py-2">{importResult}</p>
        )}

        {preview && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {(preview.rows as unknown[]).length} filas válidas · {(preview.errors as unknown[]).length} errores
            </p>
            {(preview.errors as Array<{ row: number; message: string }>).slice(0, 5).map((e, i) => (
              <p key={i} className="text-xs text-red-600">Fila {e.row}: {e.message}</p>
            ))}
            <Button onClick={handleCommit} loading={importing} disabled={(preview.rows as unknown[]).length === 0}>
              Importar {(preview.rows as unknown[]).length} alimentos
            </Button>
          </div>
        )}
      </section>

      {/* Lista de alimentos */}
      <section className="space-y-4">
        <Input id="admin-search" placeholder="Buscar..." value={query}
          onChange={(e) => setQuery(e.target.value)} />

        {loading ? <PageSpinner /> : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3 text-right">Kcal/100g</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {foods.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3 font-medium text-gray-800">{f.name}</td>
                    <td className="px-4 py-3 text-gray-500">{f.category ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{Number(f.energy_kcal_per_100g).toFixed(0)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(f.id)}
                        className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="secondary" disabled={page === 1}
              onClick={() => { const p = page - 1; setPage(p); load(query, p) }}>Anterior</Button>
            <span className="px-3 py-2 text-sm text-gray-600">{page} / {lastPage}</span>
            <Button variant="secondary" disabled={page === lastPage}
              onClick={() => { const p = page + 1; setPage(p); load(query, p) }}>Siguiente</Button>
          </div>
        )}
      </section>
    </div>
  )
}
