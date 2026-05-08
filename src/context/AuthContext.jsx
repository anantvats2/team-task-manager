import { createContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!token) {
      setUser(null)
      localStorage.removeItem('user')
    } else if (!user) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken(null)
    } else if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    }
    setInitialized(true)
  }, [token, user])

  useEffect(() => {
    const handleLogoutEvent = () => {
      setToken(null)
      setUser(null)
    }

    window.addEventListener('auth:logout', handleLogoutEvent)
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent)
    }
  }, [])

  const login = async (payload) => {
    setLoading(true)
    try {
      const data = await authService.login(payload)
      const authToken = data?.token
      if (!authToken || !data?.user) {
        return { success: false, message: 'Invalid server response' }
      }
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      setToken(authToken)
      setUser(data.user)
      return { success: true }
    } catch (error) {
      return { success: false, message: error?.response?.data?.message || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (payload) => {
    setLoading(true)
    try {
      const data = await authService.signup(payload)
      const authToken = data?.token
      if (!authToken || !data?.user) {
        return { success: false, message: 'Invalid server response' }
      }
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      setToken(authToken)
      setUser(data.user)
      return { success: true }
    } catch (error) {
      return { success: false, message: error?.response?.data?.message || 'Signup failed' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      initialized,
      isAuthenticated: Boolean(token && user),
      login,
      signup,
      logout,
    }),
    [user, token, loading, initialized],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
