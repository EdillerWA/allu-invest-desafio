import { useState, type ComponentType } from 'react'
import { NavLink, Outlet } from 'react-router'
import { motion, type Variants } from 'framer-motion'
import { ClipboardList, Landmark, LogOut, Menu, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMe } from '@/features/perfil/hooks/use-me'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'
import { cn } from '@/shared/lib/utils'
import type { RoleUsuario, UsuarioAutenticado } from '@/features/perfil/types/me.types'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  roles: RoleUsuario[]
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/investimentos',
    label: 'Investimentos',
    icon: Landmark,
    roles: ['CLIENTE'],
  },
  {
    to: '/minhas-avaliacoes',
    label: 'Minhas avaliações',
    icon: ClipboardList,
    roles: ['CLIENTE'],
  },
  {
    to: '/moderacao',
    label: 'Moderação',
    icon: ShieldCheck,
    roles: ['MODERADOR'],
  },
  {
    to: '/perfil',
    label: 'Perfil',
    icon: UserRound,
    roles: ['CLIENTE', 'MODERADOR'],
  },
]

function Logo() {
  return (
    <img
      src="/logo.png"
      alt="allu invest"
      className="w-full rounded-xl object-cover"
      style={{ aspectRatio: '800 / 533' }}
    />
  )
}

const listaVariants: Variants = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
}

const itemVariants: Variants = {
  oculto: { opacity: 0, x: -8 },
  visivel: { opacity: 1, x: 0, transition: { duration: 0.18, ease: 'easeOut' } },
}

function NavLinks({ role, onNavigate }: { role: RoleUsuario | undefined; onNavigate?: () => void }) {
  const itens = NAV_ITEMS.filter((item) => role !== undefined && item.roles.includes(role))

  return (
    <motion.nav
      className="flex flex-col gap-1"
      aria-label="Navegação principal"
      variants={listaVariants}
      initial="oculto"
      animate="visivel"
    >
      {itens.map(({ to, label, icon: Icon }) => (
        <motion.div key={to} variants={itemVariants}>
          <NavLink
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="size-5 shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
              </>
            )}
          </NavLink>
        </motion.div>
      ))}
    </motion.nav>
  )
}

function UserFooter({
  usuario,
  onLogout,
}: {
  usuario: UsuarioAutenticado | undefined
  onLogout: () => void
}) {
  const ehModerador = usuario?.role === 'MODERADOR'
  const Icon = ehModerador ? ShieldCheck : UserRound

  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {usuario ? (ehModerador ? 'Moderador' : 'Cliente') : 'Carregando...'}
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {usuario?.email ?? usuario?.id ?? ''}
        </p>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="Sair" onClick={onLogout}>
        <LogOut className="size-4" />
      </Button>
    </div>
  )
}

export function AppShell() {
  const { logout } = useAuth()
  const { data: usuario } = useMe()
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <div className="flex min-h-svh flex-col bg-background md:flex-row">
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="hidden w-72 shrink-0 flex-col gap-6 bg-muted/30 p-4 md:flex"
      >
        <Logo />
        <NavLinks role={usuario?.role} />
        <div className="flex-1" />
        <UserFooter usuario={usuario} onLogout={logout} />
      </motion.aside>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="flex h-16 shrink-0 items-center justify-between bg-muted/30 px-4 md:hidden"
      >
        <img src="/logo.png" alt="allu invest" className="h-10 w-auto rounded-lg object-cover" />
        <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Abrir menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent aria-describedby={undefined}>
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <div className="flex flex-1 flex-col gap-6 p-4">
              <Logo />
              <NavLinks role={usuario?.role} onNavigate={() => setMenuAberto(false)} />
              <div className="flex-1" />
              <UserFooter usuario={usuario} onLogout={logout} />
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
