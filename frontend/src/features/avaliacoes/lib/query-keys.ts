import type { StatusAvaliacao } from '@/shared/types/avaliacao-status'

export const avaliacoesKeys = {
  all: ['avaliacoes'] as const,
  convite: (investimentoId: string) =>
    [...avaliacoesKeys.all, 'convite', investimentoId] as const,
  minhas: (pagina: number, tamanhoPagina: number, status?: StatusAvaliacao, q?: string) =>
    [...avaliacoesKeys.all, 'minhas', pagina, tamanhoPagina, status ?? null, q ?? ''] as const,
  detalhe: (id: string) => [...avaliacoesKeys.all, 'detalhe', id] as const,
  convites: (pagina: number, tamanhoPagina: number, status?: string, q?: string) =>
    [...avaliacoesKeys.all, 'convites', pagina, tamanhoPagina, status ?? '', q ?? ''] as const,
}
