import { http } from '@/shared/lib/http'
import type { AvaliacaoModeracao } from '../types/moderacao.types'

interface ListaPaginada {
  itens: AvaliacaoModeracao[]
  total: number
}

export async function listarPendentes(
  pagina: number,
  tamanhoPagina: number,
  q?: string,
): Promise<ListaPaginada> {
  const { data } = await http.get<ListaPaginada>('/moderacao/pendentes', {
    params: { pagina, tamanhoPagina, q },
  })
  return data
}

export async function aprovarAvaliacao(id: string): Promise<AvaliacaoModeracao> {
  const { data } = await http.post<AvaliacaoModeracao>(`/moderacao/${id}/aprovar`)
  return data
}

export async function rejeitarAvaliacao(
  id: string,
  motivo: string,
): Promise<AvaliacaoModeracao> {
  const { data } = await http.post<AvaliacaoModeracao>(`/moderacao/${id}/rejeitar`, {
    motivo,
  })
  return data
}
