import { Injectable } from '@nestjs/common';
import { ArquivoStoragePort } from '../../ports/arquivo-storage.port';
import { AvaliacaoNaoEncontradaError } from '../../errors/orquestracao.errors';
import { ObterAvaliacaoHandler } from '../obter-avaliacao/obter-avaliacao.handler';
import { ObterAvaliacaoQuery } from '../obter-avaliacao/obter-avaliacao.query';
import { ObterAnexoParaDownloadQuery } from './obter-anexo-para-download.query';

export interface AnexoParaDownload {
  nomeOriginal: string;
  tipoMime: string;
  conteudo: Buffer;
}

@Injectable()
export class ObterAnexoParaDownloadHandler {
  constructor(
    private readonly obterAvaliacaoHandler: ObterAvaliacaoHandler,
    private readonly storage: ArquivoStoragePort,
  ) {}

  async executar(
    query: ObterAnexoParaDownloadQuery,
  ): Promise<AnexoParaDownload> {
    // Reaproveita a mesma checagem de posse (dono ou moderador, 404
    // anti-enumeracao nos dois casos de negativa) ja usada em
    // GET /avaliacoes/:id — nao ha motivo pra regra de acesso a um anexo
    // ser diferente da regra de acesso a avaliacao que o contem.
    const avaliacao = await this.obterAvaliacaoHandler.executar(
      new ObterAvaliacaoQuery(query.avaliacaoId, query.usuarioAutenticado),
    );

    const anexo = avaliacao.anexos.find(
      (candidato) => candidato.obterId() === query.anexoId,
    );
    if (!anexo) {
      // Mesmo erro/codigo HTTP de "avaliacao nao encontrada": um anexoId
      // que nao pertence a essa avaliacao nao deveria dar nenhuma pista
      // diferente de um avaliacaoId invalido.
      throw new AvaliacaoNaoEncontradaError(query.avaliacaoId);
    }

    const conteudo = await this.storage.ler(anexo.obterCaminhoArmazenamento());

    return {
      nomeOriginal: anexo.obterNomeOriginal(),
      tipoMime: anexo.obterTipoMime(),
      conteudo,
    };
  }
}
