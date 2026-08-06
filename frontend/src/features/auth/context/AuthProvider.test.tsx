import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/test-utils'
import { useAuth } from '../hooks/useAuth'

function TestConsumer() {
  const { login, logout, isAuthenticated } = useAuth()
  return (
    <div>
      <span>{isAuthenticated ? 'autenticado' : 'nao autenticado'}</span>
      <button onClick={() => login('token-do-outro-usuario')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  )
}

describe('AuthProvider', () => {
  it('limpa o cache de queries ao logar com um novo token', async () => {
    const { queryClient } = renderWithProviders(<TestConsumer />)
    queryClient.setQueryData(['avaliacoes', 'minhas', 1, 10], {
      itens: [{ id: 'avaliacao-do-usuario-anterior' }],
      total: 1,
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'login' }))

    expect(queryClient.getQueryData(['avaliacoes', 'minhas', 1, 10])).toBeUndefined()
    expect(screen.getByText('autenticado')).toBeInTheDocument()
  })

  it('limpa o cache de queries ao deslogar', async () => {
    const { queryClient } = renderWithProviders(<TestConsumer />)
    queryClient.setQueryData(['me'], { id: 'cliente-teste-001', role: 'CLIENTE' })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'logout' }))

    expect(queryClient.getQueryData(['me'])).toBeUndefined()
    expect(screen.getByText('nao autenticado')).toBeInTheDocument()
  })
})
