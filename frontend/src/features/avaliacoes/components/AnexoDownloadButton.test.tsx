import { describe, expect, it, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { renderWithProviders, screen, waitFor } from '@/test/test-utils'
import { AnexoDownloadButton } from './AnexoDownloadButton'
import { baixarAnexo } from '../services/avaliacoes.service'

// responseType: 'blob' via axios/XHR nao roda de forma confiavel sob
// MSW + jsdom neste setup (falha interna do interceptor de XHR do MSW ao
// montar Response a partir de Blob — limitacao do ambiente de teste, ja
// confirmada nao ser bug do componente via curl real contra o backend).
// Por isso o service e mockado direto aqui: o que estes testes cobrem e o
// estado do componente (loading/sucesso/erro), nao o transporte HTTP.
vi.mock('../services/avaliacoes.service', () => ({
  baixarAnexo: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

const ANEXO = { id: 'anexo-1', nomeOriginal: 'comprovante.pdf', tipoMime: 'application/pdf', tamanhoBytes: 2048 }

const baixarAnexoMock = vi.mocked(baixarAnexo)

describe('AnexoDownloadButton', () => {
  let cliqueSimulado: ReturnType<typeof vi.fn>

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    URL.revokeObjectURL = vi.fn()
    cliqueSimulado = vi.fn()
    HTMLAnchorElement.prototype.click = cliqueSimulado as () => void
    baixarAnexoMock.mockReset()
  })

  it('mostra nome e tamanho do anexo', () => {
    renderWithProviders(<AnexoDownloadButton avaliacaoId="avaliacao-1" anexo={ANEXO} />)

    expect(screen.getByText('comprovante.pdf')).toBeInTheDocument()
    expect(screen.getByText('2.0 KB')).toBeInTheDocument()
  })

  it('baixa o arquivo e dispara o download no navegador', async () => {
    baixarAnexoMock.mockResolvedValue(new Blob(['conteudo-do-arquivo']))

    const user = userEvent.setup()
    renderWithProviders(<AnexoDownloadButton avaliacaoId="avaliacao-1" anexo={ANEXO} />)

    await user.click(screen.getByRole('button', { name: /comprovante\.pdf/ }))

    await waitFor(() => expect(cliqueSimulado).toHaveBeenCalledTimes(1))
    expect(baixarAnexoMock).toHaveBeenCalledWith('avaliacao-1', 'anexo-1')
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('mostra spinner de carregamento enquanto a requisicao esta em voo', async () => {
    let resolver: (blob: Blob) => void = () => {}
    baixarAnexoMock.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<AnexoDownloadButton avaliacaoId="avaliacao-1" anexo={ANEXO} />)

    const botao = screen.getByRole('button', { name: /comprovante\.pdf/ })
    await user.click(botao)

    expect(botao).toBeDisabled()
    resolver(new Blob(['x']))
    await waitFor(() => expect(botao).not.toBeDisabled())
  })

  it('mostra erro visual e toast quando o download falha', async () => {
    baixarAnexoMock.mockRejectedValue(new Error('falhou'))

    const user = userEvent.setup()
    renderWithProviders(<AnexoDownloadButton avaliacaoId="avaliacao-1" anexo={ANEXO} />)

    await user.click(screen.getByRole('button', { name: /comprovante\.pdf/ }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Não foi possível baixar "comprovante.pdf".')
    })
    expect(cliqueSimulado).not.toHaveBeenCalled()
  })
})
