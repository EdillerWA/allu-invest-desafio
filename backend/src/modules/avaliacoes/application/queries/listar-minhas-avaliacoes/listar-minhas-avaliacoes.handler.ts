import { Injectable } from '@nestjs/common';
import { AvaliacaoRepositoryPort } from '../../ports/avaliacao-repository.port';
import { Avaliacao } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { ListarMinhasAvaliacoesQuery } from './listar-minhas-avaliacoes.query';

@Injectable()
export class ListarMinhasAvaliacoesHandler {
  constructor(private readonly repository: AvaliacaoRepositoryPort) {}

  async executar(
    query: ListarMinhasAvaliacoesQuery,
  ): Promise<{ itens: Avaliacao[]; total: number }> {
    return this.repository.listarPorCliente(query.clienteId, {
      pagina: query.pagina,
      tamanhoPagina: query.tamanhoPagina,
    });
  }
}
