import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { aprovarAvaliacao } from '../services/moderacao.service'
import { moderacaoKeys } from '../lib/query-keys'
import { ehErroDeModeracaoConcorrente } from '../lib/erro-moderacao-concorrente'
import { getErrorMessage } from '@/shared/types/api-error'

export function useAprovarAvaliacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => aprovarAvaliacao(id),
    onSuccess: () => {
      toast.success('Avaliação aprovada.')
      void queryClient.invalidateQueries({ queryKey: moderacaoKeys.all })
    },
    onError: (error) => {
      // Outro moderador (ou a mesma pessoa em outra aba) ja agiu sobre esta
      // avaliacao enquanto a requisicao estava em voo — cenario real de
      // concorrencia, nao um erro generico. A lista precisa ser revalidada
      // porque o item que acabou de sumir da fila real ainda apareceria
      // pendente na tela, convidando a tentar de novo e tomar o mesmo erro.
      if (ehErroDeModeracaoConcorrente(error)) {
        toast.error('Esta avaliação já foi moderada por outro moderador. A lista foi atualizada.')
        void queryClient.invalidateQueries({ queryKey: moderacaoKeys.all })
        return
      }
      toast.error(getErrorMessage(error, 'Não foi possível aprovar a avaliação.'))
    },
  })
}
