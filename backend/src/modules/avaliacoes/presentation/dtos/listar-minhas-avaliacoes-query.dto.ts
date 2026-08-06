import { IsEnum, IsOptional } from 'class-validator';
import { StatusAvaliacao } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { PaginacaoQueryDto } from './paginacao-query.dto';

export class ListarMinhasAvaliacoesQueryDto extends PaginacaoQueryDto {
  @IsOptional()
  @IsEnum(StatusAvaliacao)
  status?: StatusAvaliacao;
}
