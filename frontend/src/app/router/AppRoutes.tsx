import { AnimatePresence } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { PerfilPage } from '@/features/perfil/pages/PerfilPage'
import { ConviteAvaliacaoPage } from '@/features/avaliacoes/pages/ConviteAvaliacaoPage'
import { AnimatedPage } from './AnimatedPage'
import { NotFoundPage } from './NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'
import { RootRedirect } from './RootRedirect'

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
          <Route
            path="/perfil"
            element={
              <AnimatedPage>
                <PerfilPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/investimentos/:investimentoId/avaliar"
            element={
              <AnimatedPage>
                <ConviteAvaliacaoPage />
              </AnimatedPage>
            }
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  )
}
