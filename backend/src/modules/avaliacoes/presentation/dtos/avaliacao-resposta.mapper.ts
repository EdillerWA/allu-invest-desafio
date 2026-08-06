import {
  Avaliacao,
  TipoCriterio,
} from '@modules/avaliacoes/domain/entities/avaliacao.entity';

export interface AvaliacaoResposta {
  id: string;
  investimentoId: string;
  clienteId: string;
  status: string;
  comentario: string | null;
  motivoRejeicao: string | null;
  notas: { criterio: TipoCriterio; valor: number }[];
  anexos: { nomeOriginal: string; tipoMime: string; tamanhoBytes: number }[];
  aceitePolitica: { versao: string; dataAceite: Date } | null;
  investimento: {
    tipoProduto: string;
    valorAplicado: number;
    dataAplicacao: Date;
    dataEncerramento: Date;
    motivoEncerramento: string;
  };
}

// Traduz o aggregate de dominio (getters, Map de notas, VOs) para um
// formato plano serializavel em JSON. Necessario porque o estado real da
// entidade vive num objeto `props` privado — devolver a entidade direto
// pelo controller serializaria isso de forma quebrada (Map vira `{}` no
// JSON.stringify) e vazaria caminhoArmazenamento (path de disco interno),
// que nao e informacao do cliente.
export function paraResposta(avaliacao: Avaliacao): AvaliacaoResposta {
  return {
    id: avaliacao.id,
    investimentoId: avaliacao.investimentoId,
    clienteId: avaliacao.clienteId,
    status: avaliacao.status,
    comentario: avaliacao.comentario,
    motivoRejeicao: avaliacao.motivoRejeicao,
    notas: [...avaliacao.notas.entries()].map(([criterio, nota]) => ({
      criterio,
      valor: nota.obterValor(),
    })),
    anexos: avaliacao.anexos.map((anexo) => ({
      nomeOriginal: anexo.obterNomeOriginal(),
      tipoMime: anexo.obterTipoMime(),
      tamanhoBytes: anexo.obterTamanhoBytes(),
    })),
    aceitePolitica: avaliacao.aceitePolitica
      ? {
          versao: avaliacao.aceitePolitica.obterVersao(),
          dataAceite: avaliacao.aceitePolitica.obterDataAceite(),
        }
      : null,
    investimento: {
      tipoProduto: avaliacao.snapshotInvestimento.tipoProduto,
      valorAplicado: avaliacao.snapshotInvestimento.valorAplicado,
      dataAplicacao: avaliacao.snapshotInvestimento.dataAplicacao,
      dataEncerramento: avaliacao.snapshotInvestimento.dataEncerramento,
      motivoEncerramento: avaliacao.snapshotInvestimento.motivoEncerramento,
    },
  };
}
