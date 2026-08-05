import { Injectable } from '@nestjs/common';
import { AvaliacaoRepositoryPort } from '../../ports/avaliacao-repository.port';
import { Avaliacao } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { ListarPendentesModeracaoQuery } from './listar-pendentes-moderacao.query';

@Injectable()
export class ListarPendentesModeracaoHandler {
  constructor(private readonly repository: AvaliacaoRepositoryPort) {}

  async executar(
    query: ListarPendentesModeracaoQuery,
  ): Promise<{ itens: Avaliacao[]; total: number }> {
    return this.repository.listarPendentesDeModeracao({
      pagina: query.pagina,
      tamanhoPagina: query.tamanhoPagina,
    });
  }
}
