export type CriterioAvaliacao =
  | 'ATENDIMENTO'
  | 'CLAREZA_INFORMACOES'
  | 'FACILIDADE_RESGATE'
  | 'RENTABILIDADE_PERCEBIDA'
  | 'RECOMENDARIA_A_OUTROS'

interface CriterioAvaliacaoMetadata {
  criterio: CriterioAvaliacao
  label: string
}

export const CRITERIOS_AVALIACAO: readonly CriterioAvaliacaoMetadata[] = [
  { criterio: 'ATENDIMENTO', label: 'Atendimento' },
  { criterio: 'CLAREZA_INFORMACOES', label: 'Clareza das informações' },
  { criterio: 'FACILIDADE_RESGATE', label: 'Facilidade de resgate' },
  { criterio: 'RENTABILIDADE_PERCEBIDA', label: 'Rentabilidade percebida' },
  { criterio: 'RECOMENDARIA_A_OUTROS', label: 'Recomendaria a outros' },
]

/**
 * Escala confirmada no domínio do backend (nota.vo.ts): inteiro entre 1 e 5.
 * Não há endpoint que exponha isso — mudar a escala é editar só estas duas constantes.
 */
export const NOTA_MINIMA = 1
export const NOTA_MAXIMA = 5
