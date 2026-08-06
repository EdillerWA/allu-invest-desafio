import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'
import { server } from '@/test/server'
import { PainelModeracaoPage } from './PainelModeracaoPage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const BASE = 'http://localhost:3000/api'

const AVALIACAO_PENDENTE = {
  id: 'avaliacao-1',
  investimentoId: 'investimento-1',
  clienteId: 'cliente-1',
  status: 'EM_MODERACAO',
  comentario: null,
  motivoRejeicao: null,
  notas: [],
  anexos: [],
  aceitePolitica: { versao: '1.0', dataAceite: '2026-01-01T00:00:00.000Z' },
  investimento: {
    tipoProduto: 'CDB',
    valorAplicado: 1000,
    dataAplicacao: '2025-01-01T00:00:00.000Z',
    dataEncerramento: '2026-01-01T00:00:00.000Z',
    motivoEncerramento: 'VENCIMENTO',
  },
}

describe('PainelModeracaoPage', () => {
  it('mostra estado de carregamento antes da resposta chegar', async () => {
    server.use(
      http.get(`${BASE}/moderacao/pendentes`, async () => {
        await delay(50)
        return HttpResponse.json({ itens: [], total: 0 })
      }),
    )

    renderWithProviders(<PainelModeracaoPage />)

    expect(screen.getByText('Carregando avaliações pendentes...')).toBeInTheDocument()
  })

  it('mostra estado de erro quando a API falha', async () => {
    server.use(
      http.get(`${BASE}/moderacao/pendentes`, () =>
        HttpResponse.json({ message: 'Falha ao buscar fila' }, { status: 500 }),
      ),
    )

    renderWithProviders(<PainelModeracaoPage />)

    expect(await screen.findByText('Falha ao buscar fila')).toBeInTheDocument()
  })

  it('mostra estado vazio quando nao ha avaliacoes pendentes', async () => {
    server.use(
      http.get(`${BASE}/moderacao/pendentes`, () =>
        HttpResponse.json({ itens: [], total: 0 }),
      ),
    )

    renderWithProviders(<PainelModeracaoPage />)

    expect(
      await screen.findByText('Nenhuma avaliação pendente de moderação.'),
    ).toBeInTheDocument()
  })

  it('lista as avaliacoes pendentes reais retornadas pela API', async () => {
    server.use(
      http.get(`${BASE}/moderacao/pendentes`, () =>
        HttpResponse.json({ itens: [AVALIACAO_PENDENTE], total: 1 }),
      ),
    )

    renderWithProviders(<PainelModeracaoPage />)

    expect(await screen.findByText('CDB')).toBeInTheDocument()
    expect(screen.getByText('EM_MODERACAO')).toBeInTheDocument()
  })

  it('trata 409 do rejeitar como conflito visivel, nao erro generico, e atualiza a lista', async () => {
    let chamadasPendentes = 0
    server.use(
      http.get(`${BASE}/moderacao/pendentes`, () => {
        chamadasPendentes += 1
        return HttpResponse.json({ itens: [AVALIACAO_PENDENTE], total: 1 })
      }),
      http.post(`${BASE}/moderacao/avaliacao-1/rejeitar`, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            error: 'Conflict',
            message: 'Avaliacao avaliacao-1 ja foi moderada por outra requisicao concorrente.',
            code: 'CONFLITO_DE_MODERACAO',
          },
          { status: 409 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<PainelModeracaoPage />)

    await user.click(await screen.findByRole('button', { name: 'Rejeitar' }))
    await user.type(screen.getByLabelText('Motivo'), 'Motivo qualquer')
    await user.click(screen.getByRole('button', { name: 'Rejeitar' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Esta avaliação já foi moderada por outro moderador. A lista foi atualizada.',
      )
    })
    // A lista de pendentes precisa ser revalidada apos o 409 (chamada inicial + invalidacao).
    await waitFor(() => expect(chamadasPendentes).toBeGreaterThanOrEqual(2))
  })

  it('trata 400 TRANSICAO_INVALIDA do aprovar como o mesmo conflito de moderacao concorrente, e atualiza a lista', async () => {
    let chamadasPendentes = 0
    server.use(
      http.get(`${BASE}/moderacao/pendentes`, () => {
        chamadasPendentes += 1
        return HttpResponse.json({ itens: [AVALIACAO_PENDENTE], total: 1 })
      }),
      http.post(`${BASE}/moderacao/avaliacao-1/aprovar`, () =>
        HttpResponse.json(
          {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Nao e possivel transicionar de APROVADA para APROVADA.',
            code: 'TRANSICAO_INVALIDA',
          },
          { status: 400 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<PainelModeracaoPage />)

    await user.click(await screen.findByRole('button', { name: 'Aprovar' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Esta avaliação já foi moderada por outro moderador. A lista foi atualizada.',
      )
    })
    await waitFor(() => expect(chamadasPendentes).toBeGreaterThanOrEqual(2))
  })

  it('nao trata 400 de motivo obrigatorio como conflito de moderacao (codigo diferente)', async () => {
    let chamadasPendentes = 0
    server.use(
      http.get(`${BASE}/moderacao/pendentes`, () => {
        chamadasPendentes += 1
        return HttpResponse.json({ itens: [AVALIACAO_PENDENTE], total: 1 })
      }),
      http.post(`${BASE}/moderacao/avaliacao-1/rejeitar`, () =>
        HttpResponse.json(
          {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Motivo da rejeicao e obrigatorio.',
            code: 'MOTIVO_REJEICAO_OBRIGATORIO',
          },
          { status: 400 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<PainelModeracaoPage />)

    await user.click(await screen.findByRole('button', { name: 'Rejeitar' }))
    await user.type(screen.getByLabelText('Motivo'), 'Motivo qualquer')
    await user.click(screen.getByRole('button', { name: 'Rejeitar' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Motivo da rejeicao e obrigatorio.')
    })
    // Erro nao relacionado a moderacao concorrente: nao deve disparar revalidacao extra.
    expect(chamadasPendentes).toBe(1)
  })
})
