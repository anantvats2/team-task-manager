import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, isAuthenticated } = useAuth()
  const { showError, showSuccess } = useToast()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const validate = () => {
    const next = {}
    if (!form.email.trim()) next.email = 'Email is required'
    if (!form.password.trim()) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setApiError('')
    if (!validate()) return
    const result = await login(form)
    if (!result.success) {
      setApiError(result.message)
      showError(result.message)
      return
    }
    showSuccess('Login successful')
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-2xl border bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          error={errors.password}
        />
        {apiError && <p className="text-sm text-danger">{apiError}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Login
        </Button>
        <p className="text-sm text-slate-600">
          No account?{' '}
          <Link to="/signup" className="font-medium text-brand-700">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}
