import {
  Avaliacao,
  StatusAvaliacao,
} from '../../domain/entities/avaliacao.entity';

export abstract class AvaliacaoRepositoryPort {
  // statusEsperado so se aplica quando a avaliacao ja existe (branch de
  // UPDATE): o repositorio so grava se o status no banco ainda for esse no
  // momento da escrita — protege contra duas acoes de moderacao concorrentes
  // sobre a mesma linha. Irrelevante no branch de CREATE (avaliacao nova).
  // Ver ConflitoDeModeracaoError para o que acontece quando nao bate.
  abstract salvar(
    avaliacao: Avaliacao,
    statusEsperado?: StatusAvaliacao,
  ): Promise<void>;
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
