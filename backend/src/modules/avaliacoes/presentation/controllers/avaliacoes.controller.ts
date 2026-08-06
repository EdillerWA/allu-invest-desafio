import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  Headers,
  Param,
  ParseFilePipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@modules/identity/decorators/current-user.decorator';
import { Roles } from '@modules/identity/decorators/roles.decorator';
import type { AuthenticatedUser } from '@shared/domain/auth/authenticated-user';
import { RoleUsuario } from '@shared/domain/auth/authenticated-user';
import { SubmeterAvaliacaoHandler } from '../../application/commands/submeter-avaliacao/submeter-avaliacao.handler';
import { SubmeterAvaliacaoCommand } from '../../application/commands/submeter-avaliacao/submeter-avaliacao.command';
import { ObterAvaliacaoHandler } from '../../application/queries/obter-avaliacao/obter-avaliacao.handler';
import { ObterAvaliacaoQuery } from '../../application/queries/obter-avaliacao/obter-avaliacao.query';
import { ListarMinhasAvaliacoesHandler } from '../../application/queries/listar-minhas-avaliacoes/listar-minhas-avaliacoes.handler';
import { ListarMinhasAvaliacoesQuery } from '../../application/queries/listar-minhas-avaliacoes/listar-minhas-avaliacoes.query';
import { ObterInvestimentoParaAvaliacaoHandler } from '../../application/queries/obter-investimento-para-avaliacao/obter-investimento-para-avaliacao.handler';
import { ObterInvestimentoParaAvaliacaoQuery } from '../../application/queries/obter-investimento-para-avaliacao/obter-investimento-para-avaliacao.query';
import { ListarConvitesAvaliacaoHandler } from '../../application/queries/listar-convites-avaliacao/listar-convites-avaliacao.handler';
import { ListarConvitesAvaliacaoQuery } from '../../application/queries/listar-convites-avaliacao/listar-convites-avaliacao.query';
import { ObterAnexoParaDownloadHandler } from '../../application/queries/obter-anexo-para-download/obter-anexo-para-download.handler';
import { ObterAnexoParaDownloadQuery } from '../../application/queries/obter-anexo-para-download/obter-anexo-para-download.query';
import { SubmeterAvaliacaoDto } from '../dtos/submeter-avaliacao.dto';
import { ListarMinhasAvaliacoesQueryDto } from '../dtos/listar-minhas-avaliacoes-query.dto';
import { paraResposta } from '../dtos/avaliacao-resposta.mapper';
import {
  MAXIMO_DE_ANEXOS_POR_REQUISICAO,
  TAMANHO_MAXIMO_ANEXO_BYTES,
  TIPOS_DE_ANEXO_PERMITIDOS,
} from './upload-anexo.config';

// Este controller e do cliente (submeter/ver as proprias avaliacoes), nao do
// moderador — RBAC de papel simetrico ao @Roles(MODERADOR) do ModeracaoController.
@Controller('avaliacoes')
@Roles(RoleUsuario.CLIENTE)
export class AvaliacoesController {
  constructor(
    private readonly submeterHandler: SubmeterAvaliacaoHandler,
    private readonly obterHandler: ObterAvaliacaoHandler,
    private readonly listarMinhasHandler: ListarMinhasAvaliacoesHandler,
    private readonly obterInvestimentoParaAvaliacaoHandler: ObterInvestimentoParaAvaliacaoHandler,
    private readonly listarConvitesHandler: ListarConvitesAvaliacaoHandler,
    private readonly obterAnexoParaDownloadHandler: ObterAnexoParaDownloadHandler,
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('anexos', MAXIMO_DE_ANEXOS_POR_REQUISICAO, {
      limits: { fileSize: TAMANHO_MAXIMO_ANEXO_BYTES },
    }),
  )
  async submeter(
    @Body() dto: SubmeterAvaliacaoDto,
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new FileTypeValidator({ fileType: TIPOS_DE_ANEXO_PERMITIDOS }),
        ],
      }),
    )
    arquivos: Express.Multer.File[],
    @CurrentUser() usuario: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const command = new SubmeterAvaliacaoCommand(
      dto.investimentoId,
      usuario.id,
      dto.notas.map((nota) => ({ criterio: nota.criterio, valor: nota.valor })),
      dto.comentario ?? null,
      dto.versaoPolitica,
      idempotencyKey ?? null,
      arquivos.map((arquivo) => ({
        buffer: arquivo.buffer,
        nomeOriginal: arquivo.originalname,
        tipoMime: arquivo.mimetype,
      })),
    );

    const avaliacao = await this.submeterHandler.executar(command);
    return paraResposta(avaliacao);
  }

  @Get()
  async listarMinhas(
    @CurrentUser() usuario: AuthenticatedUser,
    @Query() paginacao: ListarMinhasAvaliacoesQueryDto,
  ) {
    const resultado = await this.listarMinhasHandler.executar(
      new ListarMinhasAvaliacoesQuery(
        usuario.id,
        paginacao.pagina ?? 1,
        paginacao.tamanhoPagina ?? 10,
        paginacao.status,
        paginacao.q,
      ),
    );

    return {
      itens: resultado.itens.map(paraResposta),
      total: resultado.total,
    };
  }

  @Get('convites')
  async listarConvites(@CurrentUser() usuario: AuthenticatedUser) {
    return this.listarConvitesHandler.executar(
      new ListarConvitesAvaliacaoQuery(usuario.id),
    );
  }

  // Precisa vir ANTES de GET /avaliacoes/:id, senao "convite" cai no :id.
  @Get('convite/:investimentoId')
  async obterConvite(
    @Param('investimentoId') investimentoId: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    const convite = await this.obterInvestimentoParaAvaliacaoHandler.executar(
      new ObterInvestimentoParaAvaliacaoQuery(investimentoId, usuario.id),
    );

    return {
      investimento: convite.investimento,
      avaliacaoExistente: convite.avaliacaoExistente
        ? paraResposta(convite.avaliacaoExistente)
        : null,
    };
  }

  @Get(':id')
  async obterPorId(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    const avaliacao = await this.obterHandler.executar(
      new ObterAvaliacaoQuery(id, usuario),
    );
    return paraResposta(avaliacao);
  }

  // Sobrescreve o @Roles(CLIENTE) da classe: moderador tambem precisa poder
  // baixar anexo de uma avaliacao pendente pra decidir aprovar/rejeitar com
  // informacao completa, nao so o cliente dono. A checagem de posse real
  // (dono OU moderador, 404 anti-enumeracao) continua no handler.
  @Get(':id/anexos/:anexoId/download')
  @Roles(RoleUsuario.CLIENTE, RoleUsuario.MODERADOR)
  async baixarAnexo(
    @Param('id') id: string,
    @Param('anexoId') anexoId: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const anexo = await this.obterAnexoParaDownloadHandler.executar(
      new ObterAnexoParaDownloadQuery(id, anexoId, usuario),
    );

    const nomeCodificado = encodeURIComponent(anexo.nomeOriginal);
    res.set({
      'Content-Type': anexo.tipoMime,
      'Content-Disposition': `attachment; filename="${nomeCodificado}"; filename*=UTF-8''${nomeCodificado}`,
    });

    return new StreamableFile(anexo.conteudo);
  }
}
