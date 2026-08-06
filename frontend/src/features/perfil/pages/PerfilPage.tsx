import { useEffect } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/shared/ui/button'
import { getErrorMessage } from '@/shared/types/api-error'
import { useMe } from '../hooks/use-me'
import { PerfilCard } from '../components/PerfilCard'

export function PerfilPage() {
  const { logout } = useAuth()
  const { data: usuario, isPending, isError, error } = useMe()

  useEffect(() => {
    if (isError) {
      toast.error(getErrorMessage(error, 'Não foi possível carregar o perfil.'))
    }
  }, [isError, error])

  function handleLogout() {
    logout()
    toast.success('Você saiu da sua conta.')
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      {isPending ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-2 text-muted-foreground"
        >
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <span>Carregando perfil...</span>
        </div>
      ) : isError ? (
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border bg-card p-6 text-center shadow-sm">
          <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(error, 'Não foi possível carregar o perfil.')}
          </p>
          <Button variant="outline" onClick={logout}>
            Voltar para o login
          </Button>
        </div>
      ) : (
        <PerfilCard usuario={usuario} onLogout={handleLogout} />
      )}
    </main>
  )
}
