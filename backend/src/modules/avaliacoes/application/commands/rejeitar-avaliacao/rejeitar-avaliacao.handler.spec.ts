import { DomainEvent } from '@shared/domain/domain-event';
import {
  Avaliacao,
  StatusAvaliacao,
  TipoCriterio,
  MotivoEncerramento,
} from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { MotivoRejeicaoObrigatorioError } from '@modules/avaliacoes/domain/errors/avaliacao.errors';
import {
  AvaliacaoNaoEncontradaError,
  ConflitoDeModeracaoError,
} from '../../errors/orquestracao.errors';
import { RejeitarAvaliacaoHandler } from './rejeitar-avaliacao.handler';
import { RejeitarAvaliacaoCommand } from './rejeitar-avaliacao.command';
import {
  criarRepositoryMock,
  criarEventPublisherMock,
} from '../../__test-utils__/ports.mock';

function criarAvaliacaoEnviada(): Avaliacao {
  const avaliacao = Avaliacao.criarConvite({
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

describe('RejeitarAvaliacaoHandler', () => {
  it('lanca AvaliacaoNaoEncontradaError quando a avaliacao nao existe', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    repository.buscarPorId.mockResolvedValue(null);

    const handler = new RejeitarAvaliacaoHandler(repository, eventPublisher);

    await expect(
      handler.executar(
        new RejeitarAvaliacaoCommand(
          'avaliacao-1',
          'moderador-1',
          'motivo valido',
        ),
      ),
    ).rejects.toThrow(AvaliacaoNaoEncontradaError);
    expect(repository.salvar).not.toHaveBeenCalled();
  });

  it('transiciona ENVIADA -> EM_MODERACAO -> REJEITADA, salva e publica avaliacao.moderada', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const avaliacao = criarAvaliacaoEnviada();
    repository.buscarPorId.mockResolvedValue(avaliacao);

    let eventoPublicado: DomainEvent | undefined;
    eventPublisher.publicar.mockImplementation((evento: DomainEvent) => {
      eventoPublicado = evento;
    });

    const handler = new RejeitarAvaliacaoHandler(repository, eventPublisher);
    const resultado = await handler.executar(
      new RejeitarAvaliacaoCommand(
        'avaliacao-1',
        'moderador-1',
        'Comentario ofensivo',
      ),
    );

    expect(resultado.status).toBe(StatusAvaliacao.REJEITADA);
    expect(resultado.motivoRejeicao).toBe('Comentario ofensivo');
    expect(repository.salvar).toHaveBeenCalledWith(
      avaliacao,
      StatusAvaliacao.ENVIADA,
    );
    expect(eventoPublicado?.nomeEvento).toBe('avaliacao.moderada');
  });

  it('rejeita quando ja esta em EM_MODERACAO, sem lancar erro de transicao invalida', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const avaliacao = criarAvaliacaoEmModeracao();
    repository.buscarPorId.mockResolvedValue(avaliacao);

    const handler = new RejeitarAvaliacaoHandler(repository, eventPublisher);
    const resultado = await handler.executar(
      new RejeitarAvaliacaoCommand('avaliacao-1', 'moderador-1', 'motivo'),
    );

    expect(resultado.status).toBe(StatusAvaliacao.REJEITADA);
  });

  it('propaga MotivoRejeicaoObrigatorioError do dominio quando o motivo e vazio', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const avaliacao = criarAvaliacaoEnviada();
    repository.buscarPorId.mockResolvedValue(avaliacao);

    const handler = new RejeitarAvaliacaoHandler(repository, eventPublisher);

    await expect(
      handler.executar(
        new RejeitarAvaliacaoCommand('avaliacao-1', 'moderador-1', ''),
      ),
    ).rejects.toThrow(MotivoRejeicaoObrigatorioError);
    expect(repository.salvar).not.toHaveBeenCalled();
  });

  it('propaga ConflitoDeModeracaoError quando o repositorio nao encontra a linha no status esperado (moderacao concorrente)', async () => {
    const repository = criarRepositoryMock();
    const eventPublisher = criarEventPublisherMock();
    const avaliacao = criarAvaliacaoEnviada();
    repository.buscarPorId.mockResolvedValue(avaliacao);
    repository.salvar.mockRejectedValue(
      new ConflitoDeModeracaoError(avaliacao.id),
    );

    const handler = new RejeitarAvaliacaoHandler(repository, eventPublisher);

    await expect(
      handler.executar(
        new RejeitarAvaliacaoCommand('avaliacao-1', 'moderador-1', 'motivo'),
      ),
    ).rejects.toThrow(ConflitoDeModeracaoError);
    expect(eventPublisher.publicar).not.toHaveBeenCalled();
  });
});
