import { describe, expect, it } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { Route, Routes } from 'react-router'
import { renderWithProviders, screen } from '@/test/test-utils'
import { server } from '@/test/server'
import { DetalheAvaliacaoPage } from './DetalheAvaliacaoPage'

const BASE = 'http://localhost:3000/api'

const AVALIACAO_REJEITADA = {
  id: 'avaliacao-1',
  investimentoId: 'investimento-1',
  clienteId: 'cliente-1',
  status: 'REJEITADA',
  comentario: 'Gostei bastante',
  motivoRejeicao: 'Nota nao condiz com o comentario',
  notas: [{ criterio: 'ATENDIMENTO', valor: 5 }],
  anexos: [
    { id: 'anexo-1', nomeOriginal: 'comprovante.pdf', tipoMime: 'application/pdf', tamanhoBytes: 100 },
  ],
  aceitePolitica: { versao: '1.0', dataAceite: '2026-01-01T00:00:00.000Z' },
  investimento: {
    tipoProduto: 'CDB',
    valorAplicado: 1000,
    dataAplicacao: '2025-01-01T00:00:00.000Z',
    dataEncerramento: '2026-01-01T00:00:00.000Z',
    motivoEncerramento: 'VENCIMENTO',
  },
}

function renderDetalhe(id: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/avaliacoes/:id" element={<DetalheAvaliacaoPage />} />
    </Routes>,
    { initialEntries: [`/avaliacoes/${id}`] },
  )
}

describe('DetalheAvaliacaoPage', () => {
  it('mostra estado de carregamento antes da resposta chegar', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes/avaliacao-1`, async () => {
        await delay(50)
        return HttpResponse.json(AVALIACAO_REJEITADA)
      }),
    )

    renderDetalhe('avaliacao-1')

    expect(screen.getByText('Carregando avaliação...')).toBeInTheDocument()
  })

  it('mostra 404 generico quando a avaliacao nao existe ou nao pertence ao cliente', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes/avaliacao-de-outro-cliente`, () =>
        HttpResponse.json(
          {
            statusCode: 404,
            error: 'Not Found',
            message: 'Avaliacao avaliacao-de-outro-cliente nao encontrada.',
            code: 'AVALIACAO_NAO_ENCONTRADA',
          },
          { status: 404 },
        ),
      ),
    )

    renderDetalhe('avaliacao-de-outro-cliente')

    expect(
      await screen.findByText('Avaliacao avaliacao-de-outro-cliente nao encontrada.'),
    ).toBeInTheDocument()
  })

  it('mostra os dados reais da avaliacao, incluindo o motivo de rejeicao', async () => {
    server.use(
      http.get(`${BASE}/avaliacoes/avaliacao-1`, () => HttpResponse.json(AVALIACAO_REJEITADA)),
    )

    renderDetalhe('avaliacao-1')

    expect(await screen.findByText('CDB')).toBeInTheDocument()
    expect(screen.getByText('Rejeitada')).toBeInTheDocument()
    expect(
      screen.getByText('Motivo da rejeição: Nota nao condiz com o comentario'),
    ).toBeInTheDocument()
    expect(screen.getByText('Gostei bastante')).toBeInTheDocument()
    expect(screen.getByText('comprovante.pdf')).toBeInTheDocument()
  })
})
