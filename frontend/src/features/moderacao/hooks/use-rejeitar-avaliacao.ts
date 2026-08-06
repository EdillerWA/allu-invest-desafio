import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { rejeitarAvaliacao } from '../services/moderacao.service'
import { moderacaoKeys } from '../lib/query-keys'
import { ehErroDeModeracaoConcorrente } from '../lib/erro-moderacao-concorrente'
import { getErrorMessage } from '@/shared/types/api-error'

interface RejeitarInput {
  id: string
  motivo: string
}

export function useRejeitarAvaliacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, motivo }: RejeitarInput) => rejeitarAvaliacao(id, motivo),
    onSuccess: () => {
      toast.success('Avaliação rejeitada.')
      void queryClient.invalidateQueries({ queryKey: moderacaoKeys.all })
    },
    onError: (error) => {
      // Mesmo cenario de concorrencia do aprovar (409 ou 400 TRANSICAO_INVALIDA,
      // dependendo do timing exato da corrida — ver erro-moderacao-concorrente.ts):
      // outro moderador, ou a mesma pessoa em outra aba, agiu primeiro.
      if (ehErroDeModeracaoConcorrente(error)) {
        toast.error('Esta avaliação já foi moderada por outro moderador. A lista foi atualizada.')
        void queryClient.invalidateQueries({ queryKey: moderacaoKeys.all })
        return
      }
      toast.error(getErrorMessage(error, 'Não foi possível rejeitar a avaliação.'))
    },
  })
}
