import { useState } from 'react'
import { Link } from 'react-router-dom'
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
        <p className="text-center text-sm text-gray-600">
          Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
        </p>
        <Link to="/login" className="mt-4 block text-center text-sm text-emerald-600 hover:underline">
          Volver al inicio de sesión
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Recuperar contraseña" subtitle="Te enviaremos un enlace por correo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="email" label="Correo electrónico" type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} error={error} required />
        <Button type="submit" loading={loading} className="w-full">
          Enviar enlace
        </Button>
      </form>
      <Link to="/login" className="block text-center text-sm text-emerald-600 hover:underline">
        Volver al inicio de sesión
      </Link>
    </AuthCard>
  )
}
