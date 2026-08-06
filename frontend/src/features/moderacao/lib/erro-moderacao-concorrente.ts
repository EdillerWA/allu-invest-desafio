import axios from 'axios'

interface ErroModeracaoBody {
  code?: string
}

const CODIGOS_MODERACAO_CONCORRENTE = ['CONFLITO_DE_MODERACAO', 'TRANSICAO_INVALIDA']

/**
 * Verdadeiro quando o erro significa "esta avaliação já foi moderada por
 * outra ação enquanto a sua estava em voo" — seja via 409 (o repositório
 * não encontrou a linha no status esperado) ou via 400 TRANSICAO_INVALIDA
 * (a leitura já viu o status final, a própria state machine do domínio
 * barrou antes de chegar no repositório). Os dois são o mesmo cenário real
 * de concorrência, só resolvido em pontos diferentes do backend dependendo
 * do timing exato da corrida.
 */
export function ehErroDeModeracaoConcorrente(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false
  }
  const body = error.response?.data as ErroModeracaoBody | undefined
  return body?.code !== undefined && CODIGOS_MODERACAO_CONCORRENTE.includes(body.code)
}
