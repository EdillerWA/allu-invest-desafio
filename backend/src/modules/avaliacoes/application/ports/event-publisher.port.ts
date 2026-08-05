import { DomainEvent } from '@shared/domain/domain-event';

export abstract class EventPublisherPort {
  abstract publicar(evento: DomainEvent): void;
}
