import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@shared/infrastructure/prisma/prisma-client';
import { AvaliacaoRepositoryPort } from '../../ports/avaliacao-repository.port';
import { EventPublisherPort } from '../../ports/event-publisher.port';
import { InvestimentoGatewayPort } from '@modules/investimentos/application/ports/investimento-gateway.port';
import { Avaliacao } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { SubmeterAvaliacaoCommand } from './submeter-avaliacao.command';
import { traduzirMotivoEncerramento } from '../../mappers/motivo-encerramento.mapper';
import {
  IdempotencyKeyEmUsoError,
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
    //Idempotencia requisicao repetida com a mesma chave. A chave identifica
    //a OPERACAO, nao valida o payload: se o corpo desta tentativa for
    //diferente do que gerou a avaliacao original (outras notas, outro
    //comentario), esse corpo novo e descartado e a avaliacao original e
    //devolvida sem comparacao — esse e o comportamento correto e esperado
    //de idempotencia por chave (o cliente que reenvia com a mesma chave
    //esta dizendo "essa e a mesma operacao", nao pedindo pra sobrescrever).
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

    //Persiste. Se duas requisicoes concorrentes passarem pelas checagens de
    //idempotencia acima antes de qualquer uma salvar, a segunda bate no
    //@unique do banco (P2002) — reconsulta em vez de propagar 500, porque o
    //contrato de idempotencia promete devolver o existente, nao quebrar.
    try {
      await this.repository.salvar(avaliacao);
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        if (command.idempotencyKey) {
          const existentePorChave =
            await this.repository.buscarPorIdempotencyKey(
              command.idempotencyKey,
            );
          if (existentePorChave) {
            return existentePorChave;
          }

          // A constraint unica de idempotencyKey foi violada (P2002), mas a
          // reconsulta filtrada por RLS nao achou a linha — ela existe, so
          // nao pertence a este cliente. Numa corrida legitima do MESMO
          // cliente a reconsulta acima sempre encontraria a propria linha;
          // chegar aqui so e possivel por reuso da mesma chave entre
          // clientes diferentes.
          throw new IdempotencyKeyEmUsoError();
        }

        const existentePorInvestimento =
          await this.repository.buscarPorInvestimentoId(command.investimentoId);
        if (existentePorInvestimento) {
          return existentePorInvestimento;
        }
      }
      throw erro;
    }

    for (const evento of avaliacao.liberarEventos()) {
      this.eventPublisher.publicar(evento);
    }

    return avaliacao;
  }
}
