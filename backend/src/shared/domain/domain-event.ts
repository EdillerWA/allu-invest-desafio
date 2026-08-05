export abstract class DomainEvent {
  readonly ocorreuEm: Date;

  constructor() {
    this.ocorreuEm = new Date();
  }

  abstract get nomeEvento(): string;
}
