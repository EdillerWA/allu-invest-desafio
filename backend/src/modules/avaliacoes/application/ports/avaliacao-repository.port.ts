import { Avaliacao } from '../../domain/entities/avaliacao.entity';

export abstract class AvaliacaoRepositoryPort {
  abstract salvar(avaliacao: Avaliacao): Promise<void>;
  abstract buscarPorId(id: string): Promise<Avaliacao | null>;
  abstract buscarPorInvestimentoId(
    investimentoId: string,
  ): Promise<Avaliacao | null>;
  abstract buscarPorIdempotencyKey(chave: string): Promise<Avaliacao | null>;
  abstract listarPorCliente(
    clienteId: string,
    paginacao: { pagina: number; tamanhoPagina: number },
  ): Promise<{ itens: Avaliacao[]; total: number }>;
  abstract listarPendentesDeModeracao(paginacao: {
    pagina: number;
    tamanhoPagina: number;
  }): Promise<{ itens: Avaliacao[]; total: number }>;
  abstract listarPublicasAprovadas(
    investimentoId: string,
    paginacao: { pagina: number; tamanhoPagina: number },
  ): Promise<{ itens: Avaliacao[]; total: number }>;
}
