export const moderacaoKeys = {
  all: ['moderacao'] as const,
  pendentes: (pagina: number, tamanhoPagina: number, q?: string) =>
    [...moderacaoKeys.all, 'pendentes', pagina, tamanhoPagina, q ?? ''] as const,
}
