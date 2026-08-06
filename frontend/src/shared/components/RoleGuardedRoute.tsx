import { Loader2 } from 'lucide-react'
import { Navigate, Outlet } from 'react-router'
import { useMe } from '@/features/perfil/hooks/use-me'
import type { RoleUsuario } from '@/features/perfil/types/me.types'

interface RoleGuardedRouteProps {
  role: RoleUsuario
}

export function RoleGuardedRoute({ role }: RoleGuardedRouteProps) {
  const { data: usuario, isPending } = useMe()

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  if (!usuario || usuario.role !== role) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
