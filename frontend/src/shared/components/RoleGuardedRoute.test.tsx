import { describe, expect, it, afterEach } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { Route, Routes } from 'react-router'
import { renderWithProviders, screen } from '@/test/test-utils'
import { server } from '@/test/server'
import { storeToken, clearStoredToken } from '@/features/auth/services/auth-storage'
import { RoleGuardedRoute } from './RoleGuardedRoute'

const BASE = 'http://localhost:3000/api'

function renderComGuard() {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<div>página pública</div>} />
      <Route element={<RoleGuardedRoute role="MODERADOR" />}>
        <Route path="/moderacao" element={<div>painel de moderação</div>} />
      </Route>
    </Routes>,
    { initialEntries: ['/moderacao'] },
  )
}

describe('RoleGuardedRoute', () => {
  afterEach(() => {
    clearStoredToken()
  })

  it('mostra carregamento enquanto o papel do usuario ainda nao chegou', async () => {
    storeToken('token-de-teste')
    server.use(
      http.get(`${BASE}/me`, async () => {
        await delay(50)
        return HttpResponse.json({ id: 'moderador-1', role: 'MODERADOR' })
      }),
    )

    const { container } = renderComGuard()

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('bloqueia cliente e redireciona, mesmo com token valido', async () => {
    storeToken('token-de-teste')
    server.use(
      http.get(`${BASE}/me`, () => HttpResponse.json({ id: 'cliente-1', role: 'CLIENTE' })),
    )

    renderComGuard()

    expect(await screen.findByText('página pública')).toBeInTheDocument()
    expect(screen.queryByText('painel de moderação')).not.toBeInTheDocument()
  })

  it('libera acesso quando o papel bate com o exigido pela rota', async () => {
    storeToken('token-de-teste')
    server.use(
      http.get(`${BASE}/me`, () => HttpResponse.json({ id: 'moderador-1', role: 'MODERADOR' })),
    )

    renderComGuard()

    expect(await screen.findByText('painel de moderação')).toBeInTheDocument()
  })
})
