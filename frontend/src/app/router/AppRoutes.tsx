import { lazy, Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Route, Routes, useLocation } from 'react-router'
import { AppShell } from '@/shared/components/AppShell'
import { RoleGuardedRoute } from '@/shared/components/RoleGuardedRoute'
import { AnimatedPage } from './AnimatedPage'
import { NotFoundPage } from './NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'
import { RootRedirect } from './RootRedirect'

// Cada pagina vira o proprio chunk, carregado só quando a rota é visitada —
// sem isso, tudo (formulario de avaliacao, painel de moderacao, etc.) ia
// pro mesmo bundle inicial que o login precisa baixar antes de mostrar
// qualquer coisa. LoginPage fica de fora de proposito: é a primeira tela
// que qualquer usuário vê, não faz sentido atrasá-la com um segundo round-trip.
import { LoginPage } from '@/features/auth/pages/LoginPage'

const PerfilPage = lazy(() =>
  import('@/features/perfil/pages/PerfilPage').then((m) => ({ default: m.PerfilPage })),
)
const ConvitesAvaliacaoPage = lazy(() =>
  import('@/features/avaliacoes/pages/ConvitesAvaliacaoPage').then((m) => ({
    default: m.ConvitesAvaliacaoPage,
  })),
)
const ConviteAvaliacaoPage = lazy(() =>
  import('@/features/avaliacoes/pages/ConviteAvaliacaoPage').then((m) => ({
    default: m.ConviteAvaliacaoPage,
  })),
)
const MinhasAvaliacoesPage = lazy(() =>
  import('@/features/avaliacoes/pages/MinhasAvaliacoesPage').then((m) => ({
    default: m.MinhasAvaliacoesPage,
  })),
)
const DetalheAvaliacaoPage = lazy(() =>
  import('@/features/avaliacoes/pages/DetalheAvaliacaoPage').then((m) => ({
    default: m.DetalheAvaliacaoPage,
  })),
)
const PainelModeracaoPage = lazy(() =>
  import('@/features/moderacao/pages/PainelModeracaoPage').then((m) => ({
    default: m.PainelModeracaoPage,
  })),
)

function CarregandoRota() {
  return (
    <div className="flex min-h-full items-center justify-center p-4 py-16">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
    </div>
  )
}

export function AppRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/entrar"
          element={
            <AnimatedPage>
              <LoginPage />
            </AnimatedPage>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route
              path="/perfil"
              element={
                <AnimatedPage>
                  <Suspense fallback={<CarregandoRota />}>
                    <PerfilPage />
                  </Suspense>
                </AnimatedPage>
              }
            />
            <Route element={<RoleGuardedRoute role="CLIENTE" />}>
              <Route
                path="/investimentos"
                element={
                  <AnimatedPage>
                    <Suspense fallback={<CarregandoRota />}>
                      <ConvitesAvaliacaoPage />
                    </Suspense>
                  </AnimatedPage>
                }
              />
              <Route
                path="/investimentos/:investimentoId/avaliar"
                element={
                  <AnimatedPage>
                    <Suspense fallback={<CarregandoRota />}>
                      <ConviteAvaliacaoPage />
                    </Suspense>
                  </AnimatedPage>
                }
              />
              <Route
                path="/minhas-avaliacoes"
                element={
                  <AnimatedPage>
                    <Suspense fallback={<CarregandoRota />}>
                      <MinhasAvaliacoesPage />
                    </Suspense>
                  </AnimatedPage>
                }
              />
              <Route
                path="/avaliacoes/:id"
                element={
                  <AnimatedPage>
                    <Suspense fallback={<CarregandoRota />}>
                      <DetalheAvaliacaoPage />
                    </Suspense>
                  </AnimatedPage>
                }
              />
            </Route>
            <Route element={<RoleGuardedRoute role="MODERADOR" />}>
              <Route
                path="/moderacao"
                element={
                  <AnimatedPage>
                    <Suspense fallback={<CarregandoRota />}>
                      <PainelModeracaoPage />
                    </Suspense>
                  </AnimatedPage>
                }
              />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  )
}
