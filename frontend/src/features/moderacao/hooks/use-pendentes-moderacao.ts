import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { listarPendentes } from '../services/moderacao.service'
import { moderacaoKeys } from '../lib/query-keys'

export function usePendentesModeracao(pagina: number, tamanhoPagina: number) {
  return useQuery({
    queryKey: moderacaoKeys.pendentes(pagina, tamanhoPagina),
    queryFn: () => listarPendentes(pagina, tamanhoPagina),
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: keepPreviousData,
  })
}
