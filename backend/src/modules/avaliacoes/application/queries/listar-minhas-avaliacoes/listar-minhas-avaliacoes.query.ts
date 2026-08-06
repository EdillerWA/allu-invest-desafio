import { StatusAvaliacao } from '@modules/avaliacoes/domain/entities/avaliacao.entity';

export class ListarMinhasAvaliacoesQuery {
  constructor(
    readonly clienteId: string,
    readonly pagina: number = 1,
    readonly tamanhoPagina: number = 10,
    readonly status?: StatusAvaliacao,
    readonly q?: string,
  ) {}
}
