import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse, delay } from 'msw'
import { renderWithProviders, screen, within } from '@/test/test-utils'
import { server } from '@/test/server'
import { ConvitesAvaliacaoPage } from './ConvitesAvaliacaoPage'

const BASE = 'http://localhost:3000/api'

describe('ConvitesAvaliacaoPage', () => {
  it('mostra estado de carregamento antes da resposta chegar', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes/convites`, async () => {
        await delay(50)
        return HttpResponse.json([])
      }),
    )

    renderWithProviders(<ConvitesAvaliacaoPage />)

    expect(screen.getByText('Carregando investimentos...')).toBeInTheDocument()
  })

  it('mostra estado de erro quando a API falha', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes/convites`, () =>
        HttpResponse.json({ message: 'Falha ao buscar investimentos' }, { status: 500 }),
      ),
    )

    renderWithProviders(<ConvitesAvaliacaoPage />)

    expect(await screen.findByText('Falha ao buscar investimentos')).toBeInTheDocument()
  })

  it('mostra estado vazio quando o cliente nao tem investimentos encerrados', async () => {
    server.use(http.get(`${BASE}/avaliacoes/convites`, () => HttpResponse.json([])))

    renderWithProviders(<ConvitesAvaliacaoPage />)

    expect(
      await screen.findByText('Nenhum investimento encerrado ainda'),
    ).toBeInTheDocument()
  })

  it('mostra botao Avaliar agora para investimento sem avaliacao', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes/convites`, () =>
        HttpResponse.json([
          {
            investimentoId: 'investimento-004',
            tipoProduto: 'CDB Prefixado',
            valorAplicado: 15000,
            dataAplicacao: '2024-11-20T00:00:00.000Z',
            dataEncerramento: '2026-05-20T00:00:00.000Z',
            motivoEncerramento: 'VENCIMENTO',
            avaliacaoId: null,
            statusAvaliacao: null,
          },
        ]),
      ),
    )

    renderWithProviders(<ConvitesAvaliacaoPage />)

    expect(await screen.findByText('CDB Prefixado')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Avaliar agora' })
    expect(link).toHaveAttribute('href', '/investimentos/investimento-004/avaliar')
  })

  it('mostra status e link de detalhe para investimento ja avaliado, sem duplicar como pendente', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes/convites`, () =>
        HttpResponse.json([
          {
            investimentoId: 'investimento-001',
            tipoProduto: 'CDB Pos-fixado',
            valorAplicado: 5000,
            dataAplicacao: '2025-01-10T00:00:00.000Z',
            dataEncerramento: '2026-01-10T00:00:00.000Z',
            motivoEncerramento: 'VENCIMENTO',
            avaliacaoId: 'avaliacao-1',
            statusAvaliacao: 'APROVADA',
          },
        ]),
      ),
    )

    renderWithProviders(<ConvitesAvaliacaoPage />)

    const link = await screen.findByRole('link', { name: 'Ver avaliação' })
    expect(within(link.closest('[data-slot="card"]') as HTMLElement).getByText('Aprovada')).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/avaliacoes/avaliacao-1')
    expect(screen.queryByRole('link', { name: 'Avaliar agora' })).not.toBeInTheDocument()
  })

  it('lida com lista mista de investimentos avaliados e nao avaliados', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes/convites`, () =>
        HttpResponse.json([
          {
            investimentoId: 'investimento-001',
            tipoProduto: 'CDB Pos-fixado',
            valorAplicado: 5000,
            dataAplicacao: '2025-01-10T00:00:00.000Z',
            dataEncerramento: '2026-01-10T00:00:00.000Z',
            motivoEncerramento: 'VENCIMENTO',
            avaliacaoId: 'avaliacao-1',
            statusAvaliacao: 'REJEITADA',
          },
          {
            investimentoId: 'investimento-004',
            tipoProduto: 'CDB Prefixado',
            valorAplicado: 15000,
            dataAplicacao: '2024-11-20T00:00:00.000Z',
            dataEncerramento: '2026-05-20T00:00:00.000Z',
            motivoEncerramento: 'VENCIMENTO',
            avaliacaoId: null,
            statusAvaliacao: null,
          },
        ]),
      ),
    )

    renderWithProviders(<ConvitesAvaliacaoPage />)

    expect(await screen.findByText('CDB Pos-fixado')).toBeInTheDocument()
    expect(screen.getByText('CDB Prefixado')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Avaliar agora' })).toHaveLength(1)
    expect(screen.getAllByRole('link', { name: 'Ver avaliação' })).toHaveLength(1)
  })

  it('filtra por status usando os chips, sem chamar a API de novo (lista ja esta em memoria)', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes/convites`, () =>
        HttpResponse.json([
          {
            investimentoId: 'investimento-001',
            tipoProduto: 'CDB Pos-fixado',
            valorAplicado: 5000,
            dataAplicacao: '2025-01-10T00:00:00.000Z',
            dataEncerramento: '2026-01-10T00:00:00.000Z',
            motivoEncerramento: 'VENCIMENTO',
            avaliacaoId: 'avaliacao-1',
            statusAvaliacao: 'REJEITADA',
          },
          {
            investimentoId: 'investimento-004',
            tipoProduto: 'CDB Prefixado',
            valorAplicado: 15000,
            dataAplicacao: '2024-11-20T00:00:00.000Z',
            dataEncerramento: '2026-05-20T00:00:00.000Z',
            motivoEncerramento: 'VENCIMENTO',
            avaliacaoId: null,
            statusAvaliacao: null,
          },
        ]),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<ConvitesAvaliacaoPage />)
    await screen.findByText('CDB Pos-fixado')

    await user.click(screen.getByRole('button', { name: 'Aguardando avaliação' }))

    expect(screen.getByText('CDB Prefixado')).toBeInTheDocument()
    expect(screen.queryByText('CDB Pos-fixado')).not.toBeInTheDocument()
  })

  it('filtra pelo texto digitado na busca', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes/convites`, () =>
        HttpResponse.json([
          {
            investimentoId: 'investimento-001',
            tipoProduto: 'CDB Pos-fixado',
            valorAplicado: 5000,
            dataAplicacao: '2025-01-10T00:00:00.000Z',
            dataEncerramento: '2026-01-10T00:00:00.000Z',
            motivoEncerramento: 'VENCIMENTO',
            avaliacaoId: null,
            statusAvaliacao: null,
          },
          {
            investimentoId: 'investimento-005',
            tipoProduto: 'LCA',
            valorAplicado: 3200,
            dataAplicacao: '2025-02-01T00:00:00.000Z',
            dataEncerramento: '2026-02-01T00:00:00.000Z',
            motivoEncerramento: 'VENCIMENTO',
            avaliacaoId: null,
            statusAvaliacao: null,
          },
        ]),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<ConvitesAvaliacaoPage />)
    await screen.findByText('CDB Pos-fixado')

    await user.type(screen.getByPlaceholderText('Buscar por produto...'), 'lca')

    expect(screen.getByText('LCA')).toBeInTheDocument()
    expect(screen.queryByText('CDB Pos-fixado')).not.toBeInTheDocument()
  })
})
