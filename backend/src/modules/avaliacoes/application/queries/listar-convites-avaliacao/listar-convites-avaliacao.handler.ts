import { Injectable } from '@nestjs/common';
import { InvestimentoGatewayPort } from '@modules/investimentos/application/ports/investimento-gateway.port';
import { AvaliacaoRepositoryPort } from '../../ports/avaliacao-repository.port';
import { ListarConvitesAvaliacaoQuery } from './listar-convites-avaliacao.query';

export interface ConviteResumo {
  investimentoId: string;
  tipoProduto: string;
  valorAplicado: number;
  dataAplicacao: Date;
  dataEncerramento: Date;
  motivoEncerramento: string;
  avaliacaoId: string | null;
  statusAvaliacao: string | null;
}

// Generaliza ObterInvestimentoParaAvaliacaoHandler (um investimentoId) para
// "todos os investimentos encerrados deste cliente" — e o que fecha a
// lacuna real do cenario do desafio: sem isso, o cliente nao tem nenhuma
// forma de descobrir quais investimentos estao esperando avaliacao, só
// digitando um investimentoId que ele já soubesse de antemao.
@Injectable()
export class ListarConvitesAvaliacaoHandler {
  constructor(
    private readonly investimentoGateway: InvestimentoGatewayPort,
    private readonly repository: AvaliacaoRepositoryPort,
  ) {}

  async executar(
    query: ListarConvitesAvaliacaoQuery,
  ): Promise<ConviteResumo[]> {
    const investimentos =
      await this.investimentoGateway.listarEncerradosPorCliente(
        query.clienteId,
      );

    return Promise.all(
      investimentos.map(async (investimento) => {
        const avaliacao = await this.repository.buscarPorInvestimentoId(
          investimento.investimentoId,
        );

        return {
          investimentoId: investimento.investimentoId,
          tipoProduto: investimento.tipoProduto,
          valorAplicado: investimento.valorAplicado,
          dataAplicacao: investimento.dataAplicacao,
          dataEncerramento: investimento.dataEncerramento,
          motivoEncerramento: investimento.motivoEncerramento,
          avaliacaoId: avaliacao?.id ?? null,
          statusAvaliacao: avaliacao?.status ?? null,
        };
      }),
    );
  }
}
