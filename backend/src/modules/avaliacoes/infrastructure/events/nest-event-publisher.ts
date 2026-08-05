import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPublisherPort } from '@modules/avaliacoes/application/ports/event-publisher.port';
import { DomainEvent } from '@shared/domain/domain-event';

@Injectable()
export class NestEventPublisher implements EventPublisherPort {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publicar(evento: DomainEvent): void {
    this.eventEmitter.emit(evento.nomeEvento, evento);
  }
}
