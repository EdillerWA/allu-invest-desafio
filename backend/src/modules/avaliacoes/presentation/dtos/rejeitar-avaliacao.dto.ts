import { IsNotEmpty, IsString } from 'class-validator';

export class RejeitarAvaliacaoDto {
  @IsString()
  @IsNotEmpty()
  motivo!: string;
}
