import { useQuery } from '@tanstack/react-query'
import { listarConvites } from '../services/avaliacoes.service'
import { avaliacoesKeys } from '../lib/query-keys'

export function useConvitesAvaliacao() {
  return useQuery({
    queryKey: avaliacoesKeys.convites(),
    queryFn: listarConvites,
    staleTime: 30 * 1000,
  })
}
