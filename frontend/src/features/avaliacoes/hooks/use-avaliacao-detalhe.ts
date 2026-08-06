import { useQuery } from '@tanstack/react-query'
import { obterPorId } from '../services/avaliacoes.service'
import { avaliacoesKeys } from '../lib/query-keys'

export function useAvaliacaoDetalhe(id: string | undefined) {
  return useQuery({
    queryKey: avaliacoesKeys.detalhe(id as string),
    queryFn: () => obterPorId(id as string),
    enabled: id !== undefined,
    retry: false,
  })
}
