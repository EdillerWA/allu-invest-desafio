export class ListarConvitesAvaliacaoQuery {
  constructor(
    readonly clienteId: string,
    readonly pagina: number = 1,
    readonly tamanhoPagina: number = 10,
    readonly status?: string,
    readonly q?: string,
  ) {}
}
