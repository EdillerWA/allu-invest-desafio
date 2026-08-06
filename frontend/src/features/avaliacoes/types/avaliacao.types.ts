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

export interface AnexoResposta {
  id: string
  nomeOriginal: string
  tipoMime: string
  tamanhoBytes: number
}

export interface AvaliacaoResposta {
  id: string
  investimentoId: string
  clienteId: string
  status: StatusAvaliacao
  comentario: string | null
  motivoRejeicao: string | null
  notas: NotaInput[]
  anexos: AnexoResposta[]
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

export interface ResumoConvites {
  totalInvestimentos: number
  aguardandoAvaliacao: number
  valorTotalAplicado: number
}

export interface ConvitesPaginados {
  itens: ConviteResumo[]
  total: number
  resumo: ResumoConvites
}
