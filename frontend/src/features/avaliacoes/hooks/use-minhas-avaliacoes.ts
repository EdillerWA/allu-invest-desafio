import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { StatusAvaliacao } from '@/shared/types/avaliacao-status'
import { listarMinhas } from '../services/avaliacoes.service'
import { avaliacoesKeys } from '../lib/query-keys'

export function useMinhasAvaliacoes(
  pagina: number,
  tamanhoPagina: number,
  filtro?: { status?: StatusAvaliacao; q?: string },
) {
  return useQuery({
    queryKey: avaliacoesKeys.minhas(pagina, tamanhoPagina, filtro?.status, filtro?.q),
    queryFn: () => listarMinhas(pagina, tamanhoPagina, filtro),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
