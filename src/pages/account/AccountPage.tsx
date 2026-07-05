import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Download, Trash2 } from 'lucide-react'
import { useAppDispatch } from '@/store/hooks'
import { clearUser } from '@/store/authSlice'
import { accountApi } from '@/api/account'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardHeader } from '@/components/ui/Card'
import { useToast } from '@/components/ui/toast'

export default function AccountPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { show } = useToast()

  const [exporting, setExporting] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await accountApi.exportData()
      show({ variant: 'success', message: 'Descarga iniciada.' })
    } finally {
      setExporting(false)
    }
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
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Mi cuenta</h1>

      <Card>
        <CardHeader
          title="Exportar mis datos"
          subtitle="Descarga toda tu información personal en formato JSON."
          action={<Download className="h-5 w-5 text-primary" />}
        />
        <Button variant="secondary" loading={exporting} onClick={handleExport}>
          Descargar mis datos
        </Button>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader title={<span className="text-destructive">Eliminar cuenta</span>} action={<Trash2 className="h-5 w-5 text-destructive" />} />
        <p className="mb-3 text-sm text-muted">Esta acción es irreversible. Se eliminará toda tu información permanentemente.</p>

        {!showDeleteConfirm ? (
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Eliminar mi cuenta
          </Button>
        ) : (
          <form onSubmit={handleDelete} className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              Confirma tu contraseña para eliminar permanentemente tu cuenta.
            </div>
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
      </Card>
    </div>
  )
}
