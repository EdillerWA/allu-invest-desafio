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

export interface ResumoConvites {
  totalInvestimentos: number;
  aguardandoAvaliacao: number;
  valorTotalAplicado: number;
}

export interface ConvitesPaginados {
  itens: ConviteResumo[];
  total: number;
  resumo: ResumoConvites;
}

const STATUS_AGUARDANDO = 'AGUARDANDO';

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
  ): Promise<ConvitesPaginados> {
    const investimentos =
      await this.investimentoGateway.listarEncerradosPorCliente(
        query.clienteId,
      );

    const todosOsConvites: ConviteResumo[] = await Promise.all(
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

    // O resumo/KPI e sempre sobre o conjunto completo do cliente, nao sobre
    // a pagina ou o filtro aplicado — senao "5 investimentos encerrados"
    // mudaria de valor so por trocar de pagina, o que confundiria mais do
    // que ajudaria.
    const resumo: ResumoConvites = {
      totalInvestimentos: todosOsConvites.length,
      aguardandoAvaliacao: todosOsConvites.filter(
        (convite) => convite.avaliacaoId === null,
      ).length,
      valorTotalAplicado: todosOsConvites.reduce(
        (soma, convite) => soma + convite.valorAplicado,
        0,
      ),
    };

    const buscaNormalizada = query.q?.trim().toLowerCase();
    const filtrados = todosOsConvites.filter((convite) => {
      const combinaStatus =
        !query.status ||
        (query.status === STATUS_AGUARDANDO
          ? convite.avaliacaoId === null
          : convite.statusAvaliacao === query.status);
      const combinaBusca =
        !buscaNormalizada ||
        convite.tipoProduto.toLowerCase().includes(buscaNormalizada);

      return combinaStatus && combinaBusca;
    });

    const inicio = (query.pagina - 1) * query.tamanhoPagina;
    const itens = filtrados.slice(inicio, inicio + query.tamanhoPagina);

    return { itens, total: filtrados.length, resumo };
  }
}
