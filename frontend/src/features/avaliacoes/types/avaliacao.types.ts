import type { CriterioAvaliacao } from '@/shared/types/criterio-avaliacao'
import type { StatusAvaliacao } from '@/shared/types/avaliacao-status'

export interface InvestimentoConvite {
  investimentoId: string
  clienteId: string
  tipoProduto: string
  valorAplicado: number
  dataAplicacao: string
  dataEncerramento: string
  motivoEncerramento: string
}

export interface NotaInput {
  criterio: CriterioAvaliacao
  valor: number
}

export interface AvaliacaoResposta {
  id: string
  investimentoId: string
  clienteId: string
  status: StatusAvaliacao
  comentario: string | null
  motivoRejeicao: string | null
  notas: NotaInput[]
  anexos: { nomeOriginal: string; tipoMime: string; tamanhoBytes: number }[]
  aceitePolitica: { versao: string; dataAceite: string } | null
  investimento: {
    tipoProduto: string
    valorAplicado: number
    dataAplicacao: string
    dataEncerramento: string
    motivoEncerramento: string
  }
}

export interface ConviteAvaliacaoResposta {
  investimento: InvestimentoConvite
  avaliacaoExistente: AvaliacaoResposta | null
}

export interface ConviteResumo {
  investimentoId: string
  tipoProduto: string
  valorAplicado: number
  dataAplicacao: string
  dataEncerramento: string
  motivoEncerramento: string
  avaliacaoId: string | null
  statusAvaliacao: StatusAvaliacao | null
}
