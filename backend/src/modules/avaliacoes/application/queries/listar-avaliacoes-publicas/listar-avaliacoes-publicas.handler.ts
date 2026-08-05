import { Injectable } from '@nestjs/common';
import { AvaliacaoRepositoryPort } from '../../ports/avaliacao-repository.port';
import { Avaliacao } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { ListarAvaliacoesPublicasQuery } from './listar-avaliacoes-publicas.query';

@Injectable()
export class ListarAvaliacoesPublicasHandler {
  constructor(private readonly repository: AvaliacaoRepositoryPort) {}

  async executar(
    query: ListarAvaliacoesPublicasQuery,
  ): Promise<{ itens: Avaliacao[]; total: number }> {
    return this.repository.listarPublicasAprovadas(query.investimentoId, {
      pagina: query.pagina,
      tamanhoPagina: query.tamanhoPagina,
    });
  }
}
