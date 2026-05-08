import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, loading, isAuthenticated } = useAuth()
  const { showError, showSuccess } = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.email.trim()) next.email = 'Email is required'
    if (form.password.trim().length < 6) next.password = 'Password must be at least 6 characters'
    if (!['admin', 'member'].includes(form.role)) next.role = 'Role is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setApiError('')
    if (!validate()) return
    const result = await signup(form)
    if (!result.success) {
      setApiError(result.message)
      showError(result.message)
      return
    }
    showSuccess('Account created successfully')
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-2xl border bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <Input
          label="Full name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          error={errors.name}
        />
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
        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:-translate-y-[1px] focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          {errors.role && <p className="mt-1 text-xs text-danger">{errors.role}</p>}
        </div>
        {apiError && <p className="text-sm text-danger">{apiError}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Sign up
        </Button>
        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-700">
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}
