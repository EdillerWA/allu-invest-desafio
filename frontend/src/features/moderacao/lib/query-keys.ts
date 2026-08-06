export const moderacaoKeys = {
  all: ['moderacao'] as const,
  pendentes: (pagina: number, tamanhoPagina: number) =>
    [...moderacaoKeys.all, 'pendentes', pagina, tamanhoPagina] as const,
}
