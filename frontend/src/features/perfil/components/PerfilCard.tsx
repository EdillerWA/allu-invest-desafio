import { LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { UsuarioAutenticado } from '../types/me.types'

interface PerfilCardProps {
  usuario: UsuarioAutenticado
  onLogout: () => void
}

export function PerfilCard({ usuario, onLogout }: PerfilCardProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-5" aria-hidden="true" />
          </span>
          <CardTitle>Usuário autenticado</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">ID</dt>
            <dd className="font-medium text-foreground">{usuario.id}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Papel
            </dt>
            <dd className="font-medium text-foreground">{usuario.role}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="size-4" aria-hidden="true" />
              E-mail
            </dt>
            <dd className="font-medium text-foreground">
              {usuario.email ?? 'não informado'}
            </dd>
          </div>
        </dl>
        <Button variant="outline" className="w-full" onClick={onLogout}>
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </Button>
      </CardContent>
    </Card>
  )
}
