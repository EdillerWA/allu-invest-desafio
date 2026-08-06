import { describe, expect, it } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { renderWithProviders, screen } from '@/test/test-utils'
import { server } from '@/test/server'
import { MinhasAvaliacoesPage } from './MinhasAvaliacoesPage'

const BASE = 'http://localhost:3000/api'

const AVALIACAO = {
  id: 'avaliacao-1',
  investimentoId: 'investimento-1',
  clienteId: 'cliente-1',
  status: 'APROVADA',
  comentario: null,
  motivoRejeicao: null,
  notas: [],
  anexos: [],
  aceitePolitica: { versao: '1.0', dataAceite: '2026-01-01T00:00:00.000Z' },
  investimento: {
    tipoProduto: 'Tesouro Selic',
    valorAplicado: 500,
    dataAplicacao: '2025-01-01T00:00:00.000Z',
    dataEncerramento: '2026-01-01T00:00:00.000Z',
    motivoEncerramento: 'VENCIMENTO',
  },
}

describe('MinhasAvaliacoesPage', () => {
  it('mostra estado de carregamento antes da resposta chegar', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes`, async () => {
        await delay(50)
        return HttpResponse.json({ itens: [], total: 0 })
      }),
    )

    renderWithProviders(<MinhasAvaliacoesPage />)

    expect(screen.getByText('Carregando avaliações...')).toBeInTheDocument()
  })

  it('mostra estado de erro quando a API falha', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes`, () =>
        HttpResponse.json({ message: 'Falha ao buscar avaliacoes' }, { status: 500 }),
      ),
    )

    renderWithProviders(<MinhasAvaliacoesPage />)

    expect(await screen.findByText('Falha ao buscar avaliacoes')).toBeInTheDocument()
  })

  it('mostra estado vazio quando o cliente nao tem avaliacoes', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes`, () => HttpResponse.json({ itens: [], total: 0 })),
    )

    renderWithProviders(<MinhasAvaliacoesPage />)

    expect(
      await screen.findByText('Você ainda não enviou nenhuma avaliação.'),
    ).toBeInTheDocument()
  })

  it('lista as avaliacoes reais retornadas pela API', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes`, () =>
        HttpResponse.json({ itens: [AVALIACAO], total: 1 }),
      ),
    )

    renderWithProviders(<MinhasAvaliacoesPage />)

    expect(await screen.findByText('Tesouro Selic')).toBeInTheDocument()
    expect(screen.getByText('Aprovada')).toBeInTheDocument()
  })
})
