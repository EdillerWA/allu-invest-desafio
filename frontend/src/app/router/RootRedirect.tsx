import { Navigate } from 'react-router'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function RootRedirect() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/perfil' : '/entrar'} replace />
}
