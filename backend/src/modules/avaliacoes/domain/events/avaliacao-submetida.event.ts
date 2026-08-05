import { DomainEvent } from '@shared/domain/domain-event';

export class AvaliacaoSubmetidaEvent extends DomainEvent {
  constructor(
    readonly avaliacaoId: string,
    readonly investimentoId: string,
    readonly clienteId: string,
  ) {
    super();
  }

  get nomeEvento(): string {
    return 'avaliacao.submetida';
  }
}
