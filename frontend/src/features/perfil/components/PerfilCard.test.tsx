import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '@/test/test-utils'
import { PerfilCard } from './PerfilCard'

describe('PerfilCard', () => {
  it('mostra o papel do usuario como titulo, nao o id cru', () => {
    renderWithProviders(
      <PerfilCard
        usuario={{ id: 'moderador-teste-001', role: 'MODERADOR' }}
        onLogout={vi.fn()}
      />,
    )

    expect(screen.getByText('Moderador')).toBeInTheDocument()
    expect(screen.getByText('moderador-teste-001')).toBeInTheDocument()
  })

  it('mostra Cliente para role CLIENTE e e-mail nao informado quando ausente', () => {
    renderWithProviders(
      <PerfilCard usuario={{ id: 'cliente-teste-001', role: 'CLIENTE' }} onLogout={vi.fn()} />,
    )

    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.getByText('não informado')).toBeInTheDocument()
  })
})
