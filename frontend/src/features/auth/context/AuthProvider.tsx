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

  const login = useCallback(
    (newToken: string) => {
      // A tela de login e "cole um token", nao um formulario de senha — nada
      // impede alguem ja autenticado como cliente-teste-001 de voltar pra
      // /entrar e colar o token de outro usuario sem clicar em "Sair" antes.
      // Sem limpar o cache aqui tambem (nao so no logout), o app mostraria
      // dados do usuario anterior ate a proxima invalidacao natural.
      queryClient.clear()
      storeToken(newToken)
      setToken(newToken)
    },
    [queryClient],
  )

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    // Limpa TUDO, nao so 'me': avaliacoes/moderacao ficavam em cache sob a
    // mesma query key independente de qual usuario esta autenticado. Sem
    // isso, logar como outro usuario na mesma aba podia mostrar por um
    // instante (ou ate a proxima invalidacao) os dados do usuario anterior.
    queryClient.clear()
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
