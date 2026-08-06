import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { listarPendentes } from '../services/moderacao.service'
import { moderacaoKeys } from '../lib/query-keys'

export function usePendentesModeracao(pagina: number, tamanhoPagina: number, q?: string) {
  return useQuery({
    queryKey: moderacaoKeys.pendentes(pagina, tamanhoPagina, q),
    queryFn: () => listarPendentes(pagina, tamanhoPagina, q),
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: keepPreviousData,
  })
}
