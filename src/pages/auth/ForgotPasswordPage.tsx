import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MailCheck } from 'lucide-react'
import { authApi } from '@/api/auth'
import AuthCard from '@/components/ui/AuthCard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword({ email })
      setSent(true)
    } catch {
      setError('No encontramos una cuenta con ese correo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthCard title="Revisa tu correo">
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="h-10 w-10 text-accent" aria-hidden="true" />
          <p className="text-sm text-muted">Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.</p>
        </div>
        <Link to="/login" className="block text-center text-sm font-medium text-primary hover:underline">
          Volver al inicio de sesión
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Recuperar contraseña" subtitle="Te enviaremos un enlace por correo">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          iconLeft={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          required
        />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Enviar enlace
        </Button>
      </form>
      <Link to="/login" className="block text-center text-sm font-medium text-primary hover:underline">
        Volver al inicio de sesión
      </Link>
    </AuthCard>
  )
}
