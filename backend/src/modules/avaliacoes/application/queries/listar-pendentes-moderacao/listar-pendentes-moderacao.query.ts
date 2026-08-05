export class ListarPendentesModeracaoQuery {
  constructor(
    readonly pagina: number = 1,
    readonly tamanhoPagina: number = 10,
  ) {}
}
