import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Download, KeyRound, ShieldOff, Trash2 } from 'lucide-react'
import { useAppDispatch } from '@/store/hooks'
import { clearUser, setConsentRequired } from '@/store/authSlice'
import { accountApi } from '@/api/account'
import { authApi } from '@/api/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardHeader } from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/toast'

const EMPTY_PASSWORD_FORM = { current_password: '', password: '', password_confirmation: '' }

export default function AccountPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { show } = useToast()

  const [exporting, setExporting] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM)
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [changingPassword, setChangingPassword] = useState(false)

  const setPasswordField = (k: keyof typeof passwordForm) => (e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm((f) => ({ ...f, [k]: e.target.value }))

  const handleExport = async () => {
    setExporting(true)
    try {
      await accountApi.exportData()
      show({ variant: 'success', message: 'Descarga iniciada.' })
    } finally {
      setExporting(false)
    }
  }

  const handleRevokeConsents = async () => {
    await accountApi.revokeAllConsents()
    dispatch(
      setConsentRequired({
        message: 'Revocaste tus consentimientos. Debes aceptarlos de nuevo para seguir registrando datos.',
        returnPath: '/account',
      }),
    )
    show({ variant: 'success', message: 'Consentimientos revocados.' })
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordErrors({})
    setChangingPassword(true)
    try {
      await authApi.updatePassword(passwordForm)
      setPasswordForm(EMPTY_PASSWORD_FORM)
      show({ variant: 'success', message: 'Contraseña actualizada.' })
    } catch (err: unknown) {
      const data = (err as { data?: { errors?: Record<string, string[]> } })?.data
      if (data?.errors) {
        const flat: Record<string, string> = {}
        for (const [k, v] of Object.entries(data.errors)) flat[k] = v[0]
        setPasswordErrors(flat)
      } else {
        setPasswordErrors({ current_password: 'No se pudo actualizar la contraseña.' })
      }
    } finally {
      setChangingPassword(false)
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

      <Card>
        <CardHeader
          title="Privacidad"
          subtitle="Revoca los consentimientos que aceptaste al registrarte. Deberás volver a aceptarlos para seguir registrando datos."
          action={<ShieldOff className="h-5 w-5 text-warning" />}
        />
        <Button variant="secondary" onClick={() => setShowRevokeConfirm(true)}>
          Revocar mis consentimientos
        </Button>
      </Card>

      <ConfirmDialog
        open={showRevokeConfirm}
        onClose={() => setShowRevokeConfirm(false)}
        onConfirm={handleRevokeConsents}
        title="Revocar consentimientos"
        description="Se revocarán los tres consentimientos vigentes (términos, privacidad y aviso de bienestar general). No podrás registrar comidas, peso ni otros datos hasta que los aceptes de nuevo."
        confirmLabel="Sí, revocar"
      />

      <Card>
        <CardHeader title="Seguridad" subtitle="Cambia tu contraseña." action={<KeyRound className="h-5 w-5 text-primary" />} />
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            id="current_password"
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            value={passwordForm.current_password}
            onChange={setPasswordField('current_password')}
            error={passwordErrors.current_password}
            required
          />
          <Input
            id="new_password"
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={passwordForm.password}
            onChange={setPasswordField('password')}
            error={passwordErrors.password}
            required
          />
          <Input
            id="new_password_confirmation"
            label="Confirmar nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={passwordForm.password_confirmation}
            onChange={setPasswordField('password_confirmation')}
            error={passwordErrors.password_confirmation}
            required
          />
          <Button type="submit" loading={changingPassword}>
            Cambiar contraseña
          </Button>
        </form>
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
