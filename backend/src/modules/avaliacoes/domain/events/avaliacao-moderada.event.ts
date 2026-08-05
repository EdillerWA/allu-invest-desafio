import { DomainEvent } from '@shared/domain/domain-event';

export type ResultadoModeracao = 'APROVADA' | 'REJEITADA';

export class AvaliacaoModeradaEvent extends DomainEvent {
  constructor(
    readonly avaliacaoId: string,
    readonly resultado: ResultadoModeracao,
    readonly moderadorId: string,
    readonly motivo?: string,
  ) {
    super();
  }

  get nomeEvento(): string {
    return 'avaliacao.moderada';
  }
}
