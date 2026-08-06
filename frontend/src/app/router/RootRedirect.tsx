import { Loader2 } from 'lucide-react'
import { Navigate } from 'react-router'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMe } from '@/features/perfil/hooks/use-me'

export function RootRedirect() {
  const { isAuthenticated } = useAuth()
  const { data: usuario, isPending } = useMe()

  if (!isAuthenticated) {
    return <Navigate to="/entrar" replace />
  }

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  return <Navigate to={usuario?.role === 'MODERADOR' ? '/moderacao' : '/investimentos'} replace />
}
