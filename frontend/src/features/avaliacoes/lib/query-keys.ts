export const avaliacoesKeys = {
  all: ['avaliacoes'] as const,
  convite: (investimentoId: string) =>
    [...avaliacoesKeys.all, 'convite', investimentoId] as const,
  minhas: (pagina: number, tamanhoPagina: number) =>
    [...avaliacoesKeys.all, 'minhas', pagina, tamanhoPagina] as const,
  detalhe: (id: string) => [...avaliacoesKeys.all, 'detalhe', id] as const,
}
