import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@modules/identity/decorators/current-user.decorator';
import { Roles } from '@modules/identity/decorators/roles.decorator';
import type { AuthenticatedUser } from '@shared/domain/auth/authenticated-user';
import { RoleUsuario } from '@shared/domain/auth/authenticated-user';
import { AprovarAvaliacaoHandler } from '../../application/commands/aprovar-avaliacao/aprovar-avaliacao.handler';
import { AprovarAvaliacaoCommand } from '../../application/commands/aprovar-avaliacao/aprovar-avaliacao.command';
import { RejeitarAvaliacaoHandler } from '../../application/commands/rejeitar-avaliacao/rejeitar-avaliacao.handler';
import { RejeitarAvaliacaoCommand } from '../../application/commands/rejeitar-avaliacao/rejeitar-avaliacao.command';
import { ListarPendentesModeracaoHandler } from '../../application/queries/listar-pendentes-moderacao/listar-pendentes-moderacao.handler';
import { ListarPendentesModeracaoQuery } from '../../application/queries/listar-pendentes-moderacao/listar-pendentes-moderacao.query';
import { PaginacaoQueryDto } from '../dtos/paginacao-query.dto';
import { RejeitarAvaliacaoDto } from '../dtos/rejeitar-avaliacao.dto';
import { paraResposta } from '../dtos/avaliacao-resposta.mapper';

// RBAC de papel (o usuario e MODERADOR ou nao), diferente do 404
// anti-enumeracao do AvaliacoesController (que trata posse de recurso).
// Aqui a negativa e sempre 403 — nao ha recurso especifico sendo escondido.
@Controller('moderacao')
@Roles(RoleUsuario.MODERADOR)
export class ModeracaoController {
  constructor(
    private readonly aprovarHandler: AprovarAvaliacaoHandler,
    private readonly rejeitarHandler: RejeitarAvaliacaoHandler,
    private readonly listarPendentesHandler: ListarPendentesModeracaoHandler,
  ) {}

  @Get('pendentes')
  async listarPendentes(@Query() paginacao: PaginacaoQueryDto) {
    const resultado = await this.listarPendentesHandler.executar(
      new ListarPendentesModeracaoQuery(
        paginacao.pagina ?? 1,
        paginacao.tamanhoPagina ?? 10,
        paginacao.q,
      ),
    );

    return {
      itens: resultado.itens.map(paraResposta),
      total: resultado.total,
    };
  }

  @Post(':id/aprovar')
  async aprovar(
    @Param('id') id: string,
    @CurrentUser() moderador: AuthenticatedUser,
  ) {
    const avaliacao = await this.aprovarHandler.executar(
      new AprovarAvaliacaoCommand(id, moderador.id),
    );
    return paraResposta(avaliacao);
  }

  @Post(':id/rejeitar')
  async rejeitar(
    @Param('id') id: string,
    @Body() dto: RejeitarAvaliacaoDto,
    @CurrentUser() moderador: AuthenticatedUser,
  ) {
    const avaliacao = await this.rejeitarHandler.executar(
      new RejeitarAvaliacaoCommand(id, moderador.id, dto.motivo),
    );
    return paraResposta(avaliacao);
  }
}
