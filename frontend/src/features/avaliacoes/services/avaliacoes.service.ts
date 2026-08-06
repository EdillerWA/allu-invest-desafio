import { http } from '@/shared/lib/http'
import type { AvaliacaoResposta, ConviteAvaliacaoResposta, NotaInput } from '../types/avaliacao.types'

export async function obterConvite(investimentoId: string): Promise<ConviteAvaliacaoResposta> {
  const { data } = await http.get<ConviteAvaliacaoResposta>(`/avaliacoes/convite/${investimentoId}`)
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
