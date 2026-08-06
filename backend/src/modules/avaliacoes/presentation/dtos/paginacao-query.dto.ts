import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class PaginacaoQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  pagina?: number;

  // Teto de 50: sem ele, ?tamanhoPagina=999999 e um vetor de abuso trivial
  // (carrega banco/memoria sem precisar de autenticacao invalida nem
  // burlar nada) — achado ja sinalizado numa revisao externa anterior a
  // este modulo.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  tamanhoPagina?: number;

  // Busca livre por tipo de produto (e clienteId, na fila de moderacao).
  // Teto curto de tamanho: e so um filtro de texto, nao ha motivo pra aceitar
  // string arbitrariamente grande num parametro de query.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
