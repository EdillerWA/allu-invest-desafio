import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { listarConvites } from '../services/avaliacoes.service'
import { avaliacoesKeys } from '../lib/query-keys'

export function useConvitesAvaliacao(
  pagina: number,
  tamanhoPagina: number,
  filtro?: { status?: string; q?: string },
) {
  return useQuery({
    queryKey: avaliacoesKeys.convites(pagina, tamanhoPagina, filtro?.status, filtro?.q),
    queryFn: () => listarConvites(pagina, tamanhoPagina, filtro),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
