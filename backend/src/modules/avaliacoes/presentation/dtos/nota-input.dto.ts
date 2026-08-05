import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { TipoCriterio } from '@modules/avaliacoes/domain/entities/avaliacao.entity';

export class NotaInputDto {
  @IsEnum(TipoCriterio)
  criterio!: TipoCriterio;

  @IsInt()
  @Min(1)
  @Max(5)
  valor!: number;
}
