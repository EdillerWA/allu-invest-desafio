import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NotaInputDto } from './nota-input.dto';

export class SubmeterAvaliacaoDto {
  @IsString()
  @IsNotEmpty()
  investimentoId!: string;

  @ValidateNested({ each: true })
  @Type(() => NotaInputDto)
  @ArrayMinSize(1)
  notas!: NotaInputDto[];

  @IsOptional()
  @IsString()
  comentario?: string;

  @IsString()
  @IsNotEmpty()
  versaoPolitica!: string;
}
