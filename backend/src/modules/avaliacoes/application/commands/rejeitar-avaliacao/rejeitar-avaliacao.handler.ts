import { Injectable } from '@nestjs/common';
import { AvaliacaoRepositoryPort } from '../../ports/avaliacao-repository.port';
import { EventPublisherPort } from '../../ports/event-publisher.port';
import {
  Avaliacao,
  StatusAvaliacao,
} from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { AvaliacaoNaoEncontradaError } from '../../errors/orquestracao.errors';
import { RejeitarAvaliacaoCommand } from './rejeitar-avaliacao.command';

@Injectable()
export class RejeitarAvaliacaoHandler {
  constructor(
    private readonly repository: AvaliacaoRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async executar(command: RejeitarAvaliacaoCommand): Promise<Avaliacao> {
    const avaliacao = await this.repository.buscarPorId(command.avaliacaoId);

    if (!avaliacao) {
      throw new AvaliacaoNaoEncontradaError(command.avaliacaoId);
    }

    if (avaliacao.status === StatusAvaliacao.ENVIADA) {
      avaliacao.enviarParaModeracao();
    }

    //Motivo obrigatorio ja validado dentro da entidade (MotivoRejeicaoObrigatorioError)
    avaliacao.rejeitar(command.moderadorId, command.motivo);

    await this.repository.salvar(avaliacao);

    for (const evento of avaliacao.liberarEventos()) {
      this.eventPublisher.publicar(evento);
    }

    return avaliacao;
  }
}
