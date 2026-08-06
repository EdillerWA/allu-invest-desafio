import { http } from '@/shared/lib/http'
import type { StatusAvaliacao } from '@/shared/types/avaliacao-status'
import type {
  AvaliacaoResposta,
  ConviteAvaliacaoResposta,
  ConviteResumo,
  NotaInput,
} from '../types/avaliacao.types'

export async function obterConvite(investimentoId: string): Promise<ConviteAvaliacaoResposta> {
  const { data } = await http.get<ConviteAvaliacaoResposta>(`/avaliacoes/convite/${investimentoId}`)
  return data
}

export async function listarConvites(): Promise<ConviteResumo[]> {
  const { data } = await http.get<ConviteResumo[]>('/avaliacoes/convites')
  return data
}

interface ListaPaginada {
  itens: AvaliacaoResposta[]
  total: number
}

interface ListarMinhasFiltro {
  status?: StatusAvaliacao
  q?: string
}

export async function listarMinhas(
  pagina: number,
  tamanhoPagina: number,
  filtro?: ListarMinhasFiltro,
): Promise<ListaPaginada> {
  const { data } = await http.get<ListaPaginada>('/avaliacoes', {
    params: { pagina, tamanhoPagina, status: filtro?.status, q: filtro?.q },
  })
  return data
}

export async function obterPorId(id: string): Promise<AvaliacaoResposta> {
  const { data } = await http.get<AvaliacaoResposta>(`/avaliacoes/${id}`)
  return data
}

interface CriarAvaliacaoInput {
  investimentoId: string
  notas: NotaInput[]
  comentario: string
  versaoPolitica: string
  anexos: File[]
}

export async function criarAvaliacao(
  input: CriarAvaliacaoInput,
  idempotencyKey: string,
): Promise<AvaliacaoResposta> {
  const formData = new FormData()
  formData.append('investimentoId', input.investimentoId)
  input.notas.forEach((nota, index) => {
    formData.append(`notas[${index}][criterio]`, nota.criterio)
    formData.append(`notas[${index}][valor]`, String(nota.valor))
  })
  if (input.comentario) {
    formData.append('comentario', input.comentario)
  }
  formData.append('versaoPolitica', input.versaoPolitica)
  input.anexos.forEach((arquivo) => formData.append('anexos', arquivo))

  const { data } = await http.post<AvaliacaoResposta>('/avaliacoes', formData, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return data
}
