import { IsInt, IsOptional, Max, Min } from 'class-validator';

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
}
