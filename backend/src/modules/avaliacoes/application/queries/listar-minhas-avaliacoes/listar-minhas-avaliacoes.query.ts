export class ListarMinhasAvaliacoesQuery {
  constructor(
    readonly clienteId: string,
    readonly pagina: number = 1,
    readonly tamanhoPagina: number = 10,
  ) {}
}
