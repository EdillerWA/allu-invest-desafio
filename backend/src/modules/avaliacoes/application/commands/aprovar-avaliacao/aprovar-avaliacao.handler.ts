import { Injectable } from '@nestjs/common';
import { AvaliacaoRepositoryPort } from '../../ports/avaliacao-repository.port';
import { EventPublisherPort } from '../../ports/event-publisher.port';
import {
  Avaliacao,
  StatusAvaliacao,
} from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { AvaliacaoNaoEncontradaError } from '../../errors/orquestracao.errors';
import { AprovarAvaliacaoCommand } from './aprovar-avaliacao.command';

@Injectable()
export class AprovarAvaliacaoHandler {
  constructor(
    private readonly repository: AvaliacaoRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async executar(command: AprovarAvaliacaoCommand): Promise<Avaliacao> {
    const avaliacao = await this.repository.buscarPorId(command.avaliacaoId);

    if (!avaliacao) {
      throw new AvaliacaoNaoEncontradaError(command.avaliacaoId);
    }

    //Transicoes invalidas (ex: aprovar direto de RASCUNHO) sao rejeitadas
    //pela propria state machine da entidade, nao precisa duplicar aqui
    if (avaliacao.status === StatusAvaliacao.ENVIADA) {
      avaliacao.enviarParaModeracao();
    }

    avaliacao.aprovar(command.moderadorId);

    await this.repository.salvar(avaliacao);

    for (const evento of avaliacao.liberarEventos()) {
      this.eventPublisher.publicar(evento);
    }

    return avaliacao;
  }
}
