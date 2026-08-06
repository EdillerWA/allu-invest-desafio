import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { clearStoredToken, getStoredToken, storeToken } from '../services/auth-storage'
import { onUnauthorized } from '../services/unauthorized-bridge'
import type { AuthContextValue } from '../types/auth.types'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const login = useCallback((newToken: string) => {
    storeToken(newToken)
    setToken(newToken)
  }, [])

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    queryClient.removeQueries({ queryKey: ['me'] })
  }, [queryClient])

  useEffect(() => {
    return onUnauthorized(() => {
      const hadSession = getStoredToken() !== null
      logout()
      if (hadSession) {
        toast.error('Sessão expirada. Faça login novamente.')
      }
      navigate('/entrar', { replace: true })
    })
  }, [logout, navigate])

  const value: AuthContextValue = {
    token,
    isAuthenticated: token !== null,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
