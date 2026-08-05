import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AvaliacaoRepositoryPort } from '../../ports/avaliacao-repository.port';
import { EventPublisherPort } from '../../ports/event-publisher.port';
import { InvestimentoGatewayPort } from '@modules/investimentos/application/ports/investimento-gateway.port';
import { Avaliacao } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { SubmeterAvaliacaoCommand } from './submeter-avaliacao.command';
import { traduzirMotivoEncerramento } from '../../mappers/motivo-encerramento.mapper';
import {
  InvestimentoNaoEncontradoError,
  InvestimentoNaoPertenceAoClienteError,
} from '../../errors/orquestracao.errors';

@Injectable()
export class SubmeterAvaliacaoHandler {
  constructor(
    private readonly repository: AvaliacaoRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
    private readonly investimentoGateway: InvestimentoGatewayPort,
  ) {}

  async executar(command: SubmeterAvaliacaoCommand): Promise<Avaliacao> {
    //Idempotencia requisicao repetida com a mesma chave
    if (command.idempotencyKey) {
      const existente = await this.repository.buscarPorIdempotencyKey(
        command.idempotencyKey,
      );
      if (existente) {
        return existente;
      }
    }

    //Idempotencia de negocio investimento ja avaliado
    const avaliacaoExistente = await this.repository.buscarPorInvestimentoId(
      command.investimentoId,
    );
    if (avaliacaoExistente) {
      return avaliacaoExistente;
    }

    //Anti-Corruption Layer busca o snapshot do contexto externo
    const investimento =
      await this.investimentoGateway.buscarInvestimentoEncerrado(
        command.investimentoId,
      );

    if (!investimento) {
      throw new InvestimentoNaoEncontradoError(command.investimentoId);
    }

    if (investimento.clienteId !== command.clienteId) {
      throw new InvestimentoNaoPertenceAoClienteError();
    }

    //Monta o aggregate
    const avaliacao = Avaliacao.criarConvite({
      id: randomUUID(),
      investimentoId: investimento.investimentoId,
      clienteId: investimento.clienteId,
      snapshotInvestimento: {
        tipoProduto: investimento.tipoProduto,
        valorAplicado: investimento.valorAplicado,
        dataAplicacao: investimento.dataAplicacao,
        dataEncerramento: investimento.dataEncerramento,
        motivoEncerramento: traduzirMotivoEncerramento(
          investimento.motivoEncerramento,
        ),
      },
    });

    for (const nota of command.notas) {
      avaliacao.definirNota(nota.criterio, nota.valor);
    }

    avaliacao.definirComentario(command.comentario);
    avaliacao.aceitarPolitica(command.versaoPolitica);

    if (command.idempotencyKey) {
      avaliacao.definirIdempotencyKey(command.idempotencyKey);
    }

    avaliacao.submeter();

    //Persiste e publica os eventos liberados pelo aggregate
    await this.repository.salvar(avaliacao);

    for (const evento of avaliacao.liberarEventos()) {
      this.eventPublisher.publicar(evento);
    }

    return avaliacao;
  }
}
