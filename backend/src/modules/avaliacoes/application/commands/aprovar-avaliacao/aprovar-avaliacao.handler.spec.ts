import { DomainEvent } from '@shared/domain/domain-event';
import {
  Avaliacao,
  StatusAvaliacao,
  TipoCriterio,
  MotivoEncerramento,
} from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { TransicaoInvalidaError } from '@modules/avaliacoes/domain/errors/avaliacao.errors';
import { AvaliacaoNaoEncontradaError } from '../../errors/orquestracao.errors';
import { AprovarAvaliacaoHandler } from './aprovar-avaliacao.handler';
import { AprovarAvaliacaoCommand } from './aprovar-avaliacao.command';
import {
  criarRepositoryMock,
  criarEventPublisherMock,
} from '../../__test-utils__/ports.mock';

function criarAvaliacaoEmRascunho(): Avaliacao {
  return Avaliacao.criarConvite({
    id: 'avaliacao-1',
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

function criarAvaliacaoEnviada(): Avaliacao {
  const avaliacao = criarAvaliacaoEmRascunho();
  avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 5);
  avaliacao.aceitarPolitica('v1');
  avaliacao.submeter();
  avaliacao.liberarEventos();
  return avaliacao;
}

function criarAvaliacaoEmModeracao(): Avaliacao {
  const avaliacao = criarAvaliacaoEnviada();
  avaliacao.enviarParaModeracao();
  return avaliacao;
}

describe('AprovarAvaliacaoHandler', () => {
  it('lanca AvaliacaoNaoEncontradaError quando a avaliacao nao existe', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    repository.buscarPorId.mockResolvedValue(null);

    const handler = new AprovarAvaliacaoHandler(repository, eventPublisher);

    await expect(
      handler.executar(
        new AprovarAvaliacaoCommand('avaliacao-1', 'moderador-1'),
      ),
    ).rejects.toThrow(AvaliacaoNaoEncontradaError);
    expect(repository.salvar).not.toHaveBeenCalled();
  });

  it('transiciona ENVIADA -> EM_MODERACAO -> APROVADA, salva e publica avaliacao.moderada', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const avaliacao = criarAvaliacaoEnviada();
    repository.buscarPorId.mockResolvedValue(avaliacao);

    let eventoPublicado: DomainEvent | undefined;
    eventPublisher.publicar.mockImplementation((evento: DomainEvent) => {
      eventoPublicado = evento;
    });

    const handler = new AprovarAvaliacaoHandler(repository, eventPublisher);
    const resultado = await handler.executar(
      new AprovarAvaliacaoCommand('avaliacao-1', 'moderador-1'),
    );

    expect(resultado.status).toBe(StatusAvaliacao.APROVADA);
    expect(repository.salvar).toHaveBeenCalledWith(avaliacao);
    expect(eventoPublicado?.nomeEvento).toBe('avaliacao.moderada');
  });

  it('aprova quando ja esta em EM_MODERACAO, sem lancar erro de transicao invalida', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const avaliacao = criarAvaliacaoEmModeracao();
    repository.buscarPorId.mockResolvedValue(avaliacao);

    const handler = new AprovarAvaliacaoHandler(repository, eventPublisher);
    const resultado = await handler.executar(
      new AprovarAvaliacaoCommand('avaliacao-1', 'moderador-1'),
    );

    expect(resultado.status).toBe(StatusAvaliacao.APROVADA);
  });

  it('propaga TransicaoInvalidaError do dominio quando a avaliacao esta em RASCUNHO', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const avaliacao = criarAvaliacaoEmRascunho();
    repository.buscarPorId.mockResolvedValue(avaliacao);

    const handler = new AprovarAvaliacaoHandler(repository, eventPublisher);

    await expect(
      handler.executar(
        new AprovarAvaliacaoCommand('avaliacao-1', 'moderador-1'),
      ),
    ).rejects.toThrow(TransicaoInvalidaError);
    expect(repository.salvar).not.toHaveBeenCalled();
  });
});
