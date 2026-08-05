import { Injectable } from '@nestjs/common';
import { AvaliacaoRepositoryPort } from '../../ports/avaliacao-repository.port';
import { Avaliacao } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { RoleUsuario } from '@shared/domain/auth/authenticated-user';
import { AvaliacaoNaoEncontradaError } from '../../errors/orquestracao.errors';
import { ObterAvaliacaoQuery } from './obter-avaliacao.query';

@Injectable()
export class ObterAvaliacaoHandler {
  constructor(private readonly repository: AvaliacaoRepositoryPort) {}

  async executar(query: ObterAvaliacaoQuery): Promise<Avaliacao> {
    const avaliacao = await this.repository.buscarPorId(query.avaliacaoId);

    if (!avaliacao) {
      throw new AvaliacaoNaoEncontradaError(query.avaliacaoId);
    }

    //Mesmo erro para "nao existe" e "existe mas nao e sua": permite ao
    //controller (Modulo 4) sempre responder 404, nunca 403 — devolver 403
    //confirmaria a um atacante que aquele ID de avaliacao existe
    //(enumeration attack), inaceitavel num produto financeiro.
    const ehDono = avaliacao.clienteId === query.usuarioAutenticado.id;
    const ehModerador = query.usuarioAutenticado.role === RoleUsuario.MODERADOR;

    if (!ehDono && !ehModerador) {
      throw new AvaliacaoNaoEncontradaError(query.avaliacaoId);
    }

    return avaliacao;
  }
}
