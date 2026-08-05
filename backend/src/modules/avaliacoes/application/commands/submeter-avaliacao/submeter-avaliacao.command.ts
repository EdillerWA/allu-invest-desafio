import { TipoCriterio } from '@modules/avaliacoes/domain/entities/avaliacao.entity';

export class SubmeterAvaliacaoCommand {
  constructor(
    readonly investimentoId: string,
    readonly clienteId: string,
    readonly notas: { criterio: TipoCriterio; valor: number }[],
    readonly comentario: string | null,
    readonly versaoPolitica: string,
    readonly idempotencyKey: string | null,
  ) {}
}
