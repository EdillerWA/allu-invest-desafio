export class RejeitarAvaliacaoCommand {
  constructor(
    readonly avaliacaoId: string,
    readonly moderadorId: string,
    readonly motivo: string,
  ) {}
}
