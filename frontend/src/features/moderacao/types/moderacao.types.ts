import type { CriterioAvaliacao } from '@/shared/types/criterio-avaliacao'
import type { StatusAvaliacao } from '@/shared/types/avaliacao-status'
import type { AnexoResposta } from '@/features/avaliacoes/types/avaliacao.types'

export interface AvaliacaoModeracao {
  id: string
  investimentoId: string
  clienteId: string
  status: StatusAvaliacao
  comentario: string | null
  motivoRejeicao: string | null
  notas: { criterio: CriterioAvaliacao; valor: number }[]
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
