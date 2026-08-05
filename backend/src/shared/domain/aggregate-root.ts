import { DomainEvent } from './domain-event';

export abstract class AggregateRoot {
  private eventos: DomainEvent[] = [];

  protected registrarEvento(evento: DomainEvent): void {
    this.eventos.push(evento);
  }

  liberarEventos(): DomainEvent[] {
    const eventos = [...this.eventos];
    this.eventos = [];
    return eventos;
  }
}
