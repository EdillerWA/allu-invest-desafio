import {
  Avaliacao,
  MotivoEncerramento,
  TipoCriterio,
} from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { Anexo } from '@modules/avaliacoes/domain/value-objects/anexo.vo';
import { RoleUsuario } from '@shared/domain/auth/authenticated-user';
import {
  criarRepositoryMock,
  criarArquivoStorageMock,
} from '../../__test-utils__/ports.mock';
import { ObterAvaliacaoHandler } from '../obter-avaliacao/obter-avaliacao.handler';
import { ObterAnexoParaDownloadHandler } from './obter-anexo-para-download.handler';
import { ObterAnexoParaDownloadQuery } from './obter-anexo-para-download.query';
import { AvaliacaoNaoEncontradaError } from '../../errors/orquestracao.errors';

function criarAvaliacaoComAnexo(clienteId = 'cliente-1'): {
  avaliacao: Avaliacao;
  anexo: Anexo;
} {
  const avaliacao = Avaliacao.criarConvite({
    id: 'avaliacao-1',
    investimentoId: 'investimento-1',
    clienteId,
    snapshotInvestimento: {
      tipoProduto: 'CDB',
      valorAplicado: 1000,
      dataAplicacao: new Date('2025-01-01'),
      dataEncerramento: new Date('2026-01-01'),
      motivoEncerramento: MotivoEncerramento.VENCIMENTO,
    },
  });
  const anexo = Anexo.criar({
    nomeOriginal: 'comprovante.pdf',
    caminhoArmazenamento: '/storage/uuid-comprovante.pdf',
    tipoMime: 'application/pdf',
    tamanhoBytes: 2048,
  });
  avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 5);
  avaliacao.adicionarAnexo(anexo);
  avaliacao.aceitarPolitica('v1');
  avaliacao.submeter();
  avaliacao.liberarEventos();
  return { avaliacao, anexo };
}

describe('ObterAnexoParaDownloadHandler', () => {
  it('devolve o conteudo do anexo quando o solicitante e o dono da avaliacao', async () => {
    const repository = criarRepositoryMock();
    const storage = criarArquivoStorageMock();
    const { avaliacao, anexo } = criarAvaliacaoComAnexo('cliente-1');
    repository.buscarPorId.mockResolvedValue(avaliacao);
    storage.ler.mockResolvedValue(Buffer.from('conteudo-real'));

    const handler = new ObterAnexoParaDownloadHandler(
      new ObterAvaliacaoHandler(repository),
      storage,
    );

    const resultado = await handler.executar(
      new ObterAnexoParaDownloadQuery('avaliacao-1', anexo.obterId(), {
        id: 'cliente-1',
        role: RoleUsuario.CLIENTE,
      }),
    );

    expect(resultado.nomeOriginal).toBe('comprovante.pdf');
    expect(resultado.tipoMime).toBe('application/pdf');
    expect(resultado.conteudo.toString()).toBe('conteudo-real');
    expect(storage.ler).toHaveBeenCalledWith('/storage/uuid-comprovante.pdf');
  });

  it('devolve o conteudo do anexo quando o solicitante e moderador, mesmo nao sendo dono', async () => {
    const repository = criarRepositoryMock();
    const storage = criarArquivoStorageMock();
    const { avaliacao, anexo } = criarAvaliacaoComAnexo('cliente-1');
    repository.buscarPorId.mockResolvedValue(avaliacao);
    storage.ler.mockResolvedValue(Buffer.from('conteudo-real'));

    const handler = new ObterAnexoParaDownloadHandler(
      new ObterAvaliacaoHandler(repository),
      storage,
    );

    const resultado = await handler.executar(
      new ObterAnexoParaDownloadQuery('avaliacao-1', anexo.obterId(), {
        id: 'moderador-1',
        role: RoleUsuario.MODERADOR,
      }),
    );

    expect(resultado.nomeOriginal).toBe('comprovante.pdf');
  });

  it('lanca AvaliacaoNaoEncontradaError (404) quando o solicitante nao e dono nem moderador', async () => {
    const repository = criarRepositoryMock();
    const storage = criarArquivoStorageMock();
    const { avaliacao, anexo } = criarAvaliacaoComAnexo('cliente-1');
    repository.buscarPorId.mockResolvedValue(avaliacao);

    const handler = new ObterAnexoParaDownloadHandler(
      new ObterAvaliacaoHandler(repository),
      storage,
    );

    await expect(
      handler.executar(
        new ObterAnexoParaDownloadQuery('avaliacao-1', anexo.obterId(), {
          id: 'cliente-2',
          role: RoleUsuario.CLIENTE,
        }),
      ),
    ).rejects.toBeInstanceOf(AvaliacaoNaoEncontradaError);
    expect(storage.ler).not.toHaveBeenCalled();
  });

  it('lanca AvaliacaoNaoEncontradaError (404) quando o anexoId nao pertence a avaliacao', async () => {
    const repository = criarRepositoryMock();
    const storage = criarArquivoStorageMock();
    const { avaliacao } = criarAvaliacaoComAnexo('cliente-1');
    repository.buscarPorId.mockResolvedValue(avaliacao);

    const handler = new ObterAnexoParaDownloadHandler(
      new ObterAvaliacaoHandler(repository),
      storage,
    );

    await expect(
      handler.executar(
        new ObterAnexoParaDownloadQuery('avaliacao-1', 'anexo-inexistente', {
          id: 'cliente-1',
          role: RoleUsuario.CLIENTE,
        }),
      ),
    ).rejects.toBeInstanceOf(AvaliacaoNaoEncontradaError);
    expect(storage.ler).not.toHaveBeenCalled();
  });
});
