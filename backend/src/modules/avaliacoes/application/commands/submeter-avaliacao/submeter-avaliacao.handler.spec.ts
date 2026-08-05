import { DomainEvent } from '@shared/domain/domain-event';
import { Prisma } from '@shared/infrastructure/prisma/prisma-client';
import { InvestimentoEncerrado } from '@modules/investimentos/application/ports/investimento-gateway.port';
import {
  Avaliacao,
  StatusAvaliacao,
  TipoCriterio,
  MotivoEncerramento,
} from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { SubmeterAvaliacaoHandler } from './submeter-avaliacao.handler';
import { SubmeterAvaliacaoCommand } from './submeter-avaliacao.command';
import {
  IdempotencyKeyEmUsoError,
  InvestimentoNaoEncontradoError,
  InvestimentoNaoPertenceAoClienteError,
} from '../../errors/orquestracao.errors';
import {
  criarRepositoryMock,
  criarEventPublisherMock,
  criarInvestimentoGatewayMock,
  criarArquivoStorageMock,
} from '../../__test-utils__/ports.mock';

function criarInvestimentoFixture(
  clienteId = 'cliente-1',
): InvestimentoEncerrado {
  return {
    investimentoId: 'investimento-1',
    clienteId,
    tipoProduto: 'CDB',
    valorAplicado: 1000,
    dataAplicacao: new Date('2025-01-01'),
    dataEncerramento: new Date('2026-01-01'),
    motivoEncerramento: 'VENCIMENTO',
  };
}

function criarCommand(
  overrides: Partial<{
    investimentoId: string;
    clienteId: string;
    idempotencyKey: string | null;
    anexos: { buffer: Buffer; nomeOriginal: string; tipoMime: string }[];
  }> = {},
): SubmeterAvaliacaoCommand {
  return new SubmeterAvaliacaoCommand(
    overrides.investimentoId ?? 'investimento-1',
    overrides.clienteId ?? 'cliente-1',
    [{ criterio: TipoCriterio.ATENDIMENTO, valor: 5 }],
    null,
    'v1',
    overrides.idempotencyKey ?? null,
    overrides.anexos ?? [],
  );
}

function criarAvaliacaoExistente(): Avaliacao {
  return Avaliacao.criarConvite({
    id: 'avaliacao-existente',
    investimentoId: 'investimento-1',
    clienteId: 'cliente-1',
    snapshotInvestimento: {
      tipoProduto: 'CDB',
      valorAplicado: 1000,
      dataAplicacao: new Date('2025-01-01'),
      dataEncerramento: new Date('2026-01-01'),
      motivoEncerramento: MotivoEncerramento.VENCIMENTO,
    },
  });
}

describe('SubmeterAvaliacaoHandler', () => {
  it('fluxo feliz: monta o aggregate, salva e publica o evento avaliacao.submetida', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const investimentoGateway = criarInvestimentoGatewayMock();
    const arquivoStorage = criarArquivoStorageMock();

    let eventoPublicado: DomainEvent | undefined;
    eventPublisher.publicar.mockImplementation((evento: DomainEvent) => {
      eventoPublicado = evento;
    });

    repository.buscarPorInvestimentoId.mockResolvedValue(null);
    investimentoGateway.buscarInvestimentoEncerrado.mockResolvedValue(
      criarInvestimentoFixture(),
    );

    const handler = new SubmeterAvaliacaoHandler(
      repository,
      eventPublisher,
      investimentoGateway,
      arquivoStorage,
    );

    const avaliacao = await handler.executar(criarCommand());

    expect(avaliacao.status).toBe(StatusAvaliacao.ENVIADA);
    expect(repository.salvar).toHaveBeenCalledWith(avaliacao);
    expect(eventPublisher.publicar).toHaveBeenCalledTimes(1);
    expect(eventoPublicado?.nomeEvento).toBe('avaliacao.submetida');
  });

  it('anexos: salva cada arquivo via ArquivoStoragePort e inclui o Anexo resultante na avaliacao, com o caminho e tamanho devolvidos pelo storage (nao os do upload)', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const investimentoGateway = criarInvestimentoGatewayMock();
    const arquivoStorage = criarArquivoStorageMock();

    repository.buscarPorInvestimentoId.mockResolvedValue(null);
    investimentoGateway.buscarInvestimentoEncerrado.mockResolvedValue(
      criarInvestimentoFixture(),
    );
    arquivoStorage.salvar.mockResolvedValue({
      caminhoArmazenamento: '/storage/uuid-gerado-comprovante.pdf',
      tamanhoBytes: 2048,
    });

    const handler = new SubmeterAvaliacaoHandler(
      repository,
      eventPublisher,
      investimentoGateway,
      arquivoStorage,
    );

    const bufferDoUpload = Buffer.from('conteudo do arquivo');
    const avaliacao = await handler.executar(
      criarCommand({
        anexos: [
          {
            buffer: bufferDoUpload,
            nomeOriginal: 'comprovante.pdf',
            tipoMime: 'application/pdf',
          },
        ],
      }),
    );

    expect(arquivoStorage.salvar).toHaveBeenCalledWith({
      buffer: bufferDoUpload,
      nomeOriginal: 'comprovante.pdf',
      tipoMime: 'application/pdf',
    });
    expect(avaliacao.anexos).toHaveLength(1);
    expect(avaliacao.anexos[0].obterNomeOriginal()).toBe('comprovante.pdf');
    expect(avaliacao.anexos[0].obterCaminhoArmazenamento()).toBe(
      '/storage/uuid-gerado-comprovante.pdf',
    );
    expect(avaliacao.anexos[0].obterTamanhoBytes()).toBe(2048);
  });

  it('idempotencia por idempotencyKey: retorna a existente sem chamar o gateway de novo', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const investimentoGateway = criarInvestimentoGatewayMock();
    const arquivoStorage = criarArquivoStorageMock();

    const existente = criarAvaliacaoExistente();
    repository.buscarPorIdempotencyKey.mockResolvedValue(existente);

    const handler = new SubmeterAvaliacaoHandler(
      repository,
      eventPublisher,
      investimentoGateway,
      arquivoStorage,
    );

    const resultado = await handler.executar(
      criarCommand({ idempotencyKey: 'chave-repetida' }),
    );

    expect(resultado).toBe(existente);
    expect(
      investimentoGateway.buscarInvestimentoEncerrado,
    ).not.toHaveBeenCalled();
    expect(repository.salvar).not.toHaveBeenCalled();
  });

  it('idempotencia por investimentoId ja avaliado: retorna a existente sem chamar o gateway', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const investimentoGateway = criarInvestimentoGatewayMock();
    const arquivoStorage = criarArquivoStorageMock();

    const existente = criarAvaliacaoExistente();
    repository.buscarPorInvestimentoId.mockResolvedValue(existente);

    const handler = new SubmeterAvaliacaoHandler(
      repository,
      eventPublisher,
      investimentoGateway,
      arquivoStorage,
    );

    const resultado = await handler.executar(criarCommand());

    expect(resultado).toBe(existente);
    expect(
      investimentoGateway.buscarInvestimentoEncerrado,
    ).not.toHaveBeenCalled();
    expect(repository.salvar).not.toHaveBeenCalled();
  });

  it('investimento nao encontrado lanca InvestimentoNaoEncontradoError', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const investimentoGateway = criarInvestimentoGatewayMock();
    const arquivoStorage = criarArquivoStorageMock();

    repository.buscarPorInvestimentoId.mockResolvedValue(null);
    investimentoGateway.buscarInvestimentoEncerrado.mockResolvedValue(null);

    const handler = new SubmeterAvaliacaoHandler(
      repository,
      eventPublisher,
      investimentoGateway,
      arquivoStorage,
    );

    await expect(handler.executar(criarCommand())).rejects.toThrow(
      InvestimentoNaoEncontradoError,
    );
  });

  it('investimento de outro cliente lanca InvestimentoNaoPertenceAoClienteError', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const investimentoGateway = criarInvestimentoGatewayMock();
    const arquivoStorage = criarArquivoStorageMock();

    repository.buscarPorInvestimentoId.mockResolvedValue(null);
    investimentoGateway.buscarInvestimentoEncerrado.mockResolvedValue(
      criarInvestimentoFixture('outro-cliente'),
    );

    const handler = new SubmeterAvaliacaoHandler(
      repository,
      eventPublisher,
      investimentoGateway,
      arquivoStorage,
    );

    await expect(
      handler.executar(criarCommand({ clienteId: 'cliente-1' })),
    ).rejects.toThrow(InvestimentoNaoPertenceAoClienteError);
  });

  it('idempotencyKey ja usada por OUTRO cliente: reconciliacao pos-P2002 nao acha a linha (RLS filtra por nao ser do dono) e lanca IdempotencyKeyEmUsoError, nao o erro cru do Prisma', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const investimentoGateway = criarInvestimentoGatewayMock();
    const arquivoStorage = criarArquivoStorageMock();

    // Checagem inicial de idempotencia: RLS ja filtra a linha do outro
    // cliente, entao "nao existe" do ponto de vista deste cliente.
    repository.buscarPorIdempotencyKey.mockResolvedValueOnce(null);
    repository.buscarPorInvestimentoId.mockResolvedValue(null);
    investimentoGateway.buscarInvestimentoEncerrado.mockResolvedValue(
      criarInvestimentoFixture(),
    );
    repository.salvar.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`idempotencyKey`)',
        { code: 'P2002', clientVersion: '7.9.1' },
      ),
    );
    // Reconciliacao apos o P2002: mesma chave, mesmo motivo (RLS filtra
    // por nao ser a linha deste cliente) — continua null.
    repository.buscarPorIdempotencyKey.mockResolvedValueOnce(null);

    const handler = new SubmeterAvaliacaoHandler(
      repository,
      eventPublisher,
      investimentoGateway,
      arquivoStorage,
    );

    await expect(
      handler.executar(
        criarCommand({ idempotencyKey: 'chave-de-outro-cliente' }),
      ),
    ).rejects.toThrow(IdempotencyKeyEmUsoError);
    expect(repository.buscarPorIdempotencyKey).toHaveBeenCalledTimes(2);
  });
});
