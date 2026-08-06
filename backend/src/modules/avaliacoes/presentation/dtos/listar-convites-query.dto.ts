import { IsIn, IsOptional } from 'class-validator';
import { StatusAvaliacao } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { PaginacaoQueryDto } from './paginacao-query.dto';

const STATUS_VALIDOS = [...Object.values(StatusAvaliacao), 'AGUARDANDO'];

export class ListarConvitesQueryDto extends PaginacaoQueryDto {
  @IsOptional()
  @IsIn(STATUS_VALIDOS)
  status?: string;
}
