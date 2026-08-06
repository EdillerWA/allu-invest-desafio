/** O backend não retorna totalPaginas — só `total` e `tamanhoPagina` são conhecidos. */
export function calcularTotalPaginas(total: number, tamanhoPagina: number): number {
  if (tamanhoPagina <= 0) return 0
  return Math.ceil(total / tamanhoPagina)
}
