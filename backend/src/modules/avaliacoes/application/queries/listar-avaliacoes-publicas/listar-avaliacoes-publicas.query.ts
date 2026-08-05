export class ListarAvaliacoesPublicasQuery {
  constructor(
    readonly investimentoId: string,
    readonly pagina: number = 1,
    readonly tamanhoPagina: number = 10,
  ) {}
}
