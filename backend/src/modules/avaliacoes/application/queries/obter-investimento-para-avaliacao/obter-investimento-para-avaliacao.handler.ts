import { Injectable } from '@nestjs/common';
import {
  InvestimentoGatewayPort,
  InvestimentoEncerrado,
} from '@modules/investimentos/application/ports/investimento-gateway.port';
import { AvaliacaoRepositoryPort } from '../../ports/avaliacao-repository.port';
import { Avaliacao } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import {
  InvestimentoNaoEncontradoError,
  InvestimentoNaoPertenceAoClienteError,
} from '../../errors/orquestracao.errors';
import { ObterInvestimentoParaAvaliacaoQuery } from './obter-investimento-para-avaliacao.query';

export interface ConviteAvaliacao {
  investimento: InvestimentoEncerrado;
  avaliacaoExistente: Avaliacao | null;
}

@Injectable()
export class ObterInvestimentoParaAvaliacaoHandler {
  constructor(
    private readonly repository: AvaliacaoRepositoryPort,
    private readonly investimentoGateway: InvestimentoGatewayPort,
  ) {}

  async executar(
    query: ObterInvestimentoParaAvaliacaoQuery,
  ): Promise<ConviteAvaliacao> {
    const investimento =
      await this.investimentoGateway.buscarInvestimentoEncerrado(
        query.investimentoId,
      );

    if (!investimento) {
      throw new InvestimentoNaoEncontradoError(query.investimentoId);
    }

    if (investimento.clienteId !== query.clienteId) {
      throw new InvestimentoNaoPertenceAoClienteError();
    }

    const avaliacaoExistente = await this.repository.buscarPorInvestimentoId(
      query.investimentoId,
    );

    return { investimento, avaliacaoExistente };
  }
}
