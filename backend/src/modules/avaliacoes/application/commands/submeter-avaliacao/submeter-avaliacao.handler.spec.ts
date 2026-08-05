import { DomainEvent } from '@shared/domain/domain-event';
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
  InvestimentoNaoEncontradoError,
  InvestimentoNaoPertenceAoClienteError,
} from '../../errors/orquestracao.errors';
import {
  criarRepositoryMock,
  criarEventPublisherMock,
  criarInvestimentoGatewayMock,
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
  }> = {},
): SubmeterAvaliacaoCommand {
  return new SubmeterAvaliacaoCommand(
    overrides.investimentoId ?? 'investimento-1',
    overrides.clienteId ?? 'cliente-1',
    [{ criterio: TipoCriterio.ATENDIMENTO, valor: 5 }],
    null,
    'v1',
    overrides.idempotencyKey ?? null,
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
    );

    const avaliacao = await handler.executar(criarCommand());

    expect(avaliacao.status).toBe(StatusAvaliacao.ENVIADA);
    expect(repository.salvar).toHaveBeenCalledWith(avaliacao);
    expect(eventPublisher.publicar).toHaveBeenCalledTimes(1);
    expect(eventoPublicado?.nomeEvento).toBe('avaliacao.submetida');
  });

  it('idempotencia por idempotencyKey: retorna a existente sem chamar o gateway de novo', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const investimentoGateway = criarInvestimentoGatewayMock();

    const existente = criarAvaliacaoExistente();
    repository.buscarPorIdempotencyKey.mockResolvedValue(existente);

    const handler = new SubmeterAvaliacaoHandler(
      repository,
      eventPublisher,
      investimentoGateway,
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

    const existente = criarAvaliacaoExistente();
    repository.buscarPorInvestimentoId.mockResolvedValue(existente);

    const handler = new SubmeterAvaliacaoHandler(
      repository,
      eventPublisher,
      investimentoGateway,
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

    repository.buscarPorInvestimentoId.mockResolvedValue(null);
    investimentoGateway.buscarInvestimentoEncerrado.mockResolvedValue(null);

    const handler = new SubmeterAvaliacaoHandler(
      repository,
      eventPublisher,
      investimentoGateway,
    );

    await expect(handler.executar(criarCommand())).rejects.toThrow(
      InvestimentoNaoEncontradoError,
    );
  });

  it('investimento de outro cliente lanca InvestimentoNaoPertenceAoClienteError', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const investimentoGateway = criarInvestimentoGatewayMock();

    repository.buscarPorInvestimentoId.mockResolvedValue(null);
    investimentoGateway.buscarInvestimentoEncerrado.mockResolvedValue(
      criarInvestimentoFixture('outro-cliente'),
    );

    const handler = new SubmeterAvaliacaoHandler(
      repository,
      eventPublisher,
      investimentoGateway,
    );

    await expect(
      handler.executar(criarCommand({ clienteId: 'cliente-1' })),
    ).rejects.toThrow(InvestimentoNaoPertenceAoClienteError);
  });
});
