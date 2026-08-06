import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { listarMinhas } from '../services/avaliacoes.service'
import { avaliacoesKeys } from '../lib/query-keys'

export function useMinhasAvaliacoes(pagina: number, tamanhoPagina: number) {
  return useQuery({
    queryKey: avaliacoesKeys.minhas(pagina, tamanhoPagina),
    queryFn: () => listarMinhas(pagina, tamanhoPagina),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
