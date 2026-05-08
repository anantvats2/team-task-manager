import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initialized } = useAuth()
  if (!initialized) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
