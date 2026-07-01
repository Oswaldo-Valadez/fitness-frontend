import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { clearUser } from '@/store/authSlice'
import { accountApi } from '@/api/account'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function AccountPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [exporting, setExporting] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try { await accountApi.exportData() }
    finally { setExporting(false) }
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeleteError('')
    setDeleting(true)
    try {
      await accountApi.deleteAccount(deletePassword)
      dispatch(clearUser())
      navigate('/login', { replace: true })
    } catch {
      setDeleteError('Contraseña incorrecta o error al eliminar la cuenta.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Mi cuenta</h1>

      {/* Exportar datos */}
      <section className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-800">Exportar mis datos</h2>
        <p className="text-sm text-gray-500">
          Descarga toda tu información personal en formato JSON.
        </p>
        <Button variant="secondary" loading={exporting} onClick={handleExport}>
          Descargar mis datos
        </Button>
      </section>

      {/* Eliminar cuenta */}
      <section className="rounded-2xl bg-white p-6 shadow-sm space-y-3 border border-red-100">
        <h2 className="font-semibold text-red-700">Eliminar cuenta</h2>
        <p className="text-sm text-gray-500">
          Esta acción es irreversible. Se eliminará toda tu información permanentemente.
        </p>

        {!showDeleteConfirm ? (
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Eliminar mi cuenta
          </Button>
        ) : (
          <form onSubmit={handleDelete} className="space-y-4">
            <Input
              id="delete-password"
              label="Confirma tu contraseña actual"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              error={deleteError}
              required
            />
            <div className="flex gap-3">
              <Button type="submit" variant="danger" loading={deleting}>
                Sí, eliminar cuenta
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
