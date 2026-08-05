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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@modules/identity/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@shared/domain/auth/authenticated-user';
import { SubmeterAvaliacaoHandler } from '../../application/commands/submeter-avaliacao/submeter-avaliacao.handler';
import { SubmeterAvaliacaoCommand } from '../../application/commands/submeter-avaliacao/submeter-avaliacao.command';
import { ObterAvaliacaoHandler } from '../../application/queries/obter-avaliacao/obter-avaliacao.handler';
import { ObterAvaliacaoQuery } from '../../application/queries/obter-avaliacao/obter-avaliacao.query';
import { ListarMinhasAvaliacoesHandler } from '../../application/queries/listar-minhas-avaliacoes/listar-minhas-avaliacoes.handler';
import { ListarMinhasAvaliacoesQuery } from '../../application/queries/listar-minhas-avaliacoes/listar-minhas-avaliacoes.query';
import { ObterInvestimentoParaAvaliacaoHandler } from '../../application/queries/obter-investimento-para-avaliacao/obter-investimento-para-avaliacao.handler';
import { ObterInvestimentoParaAvaliacaoQuery } from '../../application/queries/obter-investimento-para-avaliacao/obter-investimento-para-avaliacao.query';
import { SubmeterAvaliacaoDto } from '../dtos/submeter-avaliacao.dto';
import { PaginacaoQueryDto } from '../dtos/paginacao-query.dto';
import { paraResposta } from '../dtos/avaliacao-resposta.mapper';
import {
  MAXIMO_DE_ANEXOS_POR_REQUISICAO,
  TAMANHO_MAXIMO_ANEXO_BYTES,
  TIPOS_DE_ANEXO_PERMITIDOS,
} from './upload-anexo.config';

@Controller('avaliacoes')
export class AvaliacoesController {
  constructor(
    private readonly submeterHandler: SubmeterAvaliacaoHandler,
    private readonly obterHandler: ObterAvaliacaoHandler,
    private readonly listarMinhasHandler: ListarMinhasAvaliacoesHandler,
    private readonly obterInvestimentoParaAvaliacaoHandler: ObterInvestimentoParaAvaliacaoHandler,
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
    @Query() paginacao: PaginacaoQueryDto,
  ) {
    const resultado = await this.listarMinhasHandler.executar(
      new ListarMinhasAvaliacoesQuery(
        usuario.id,
        paginacao.pagina ?? 1,
        paginacao.tamanhoPagina ?? 10,
      ),
    );

    return {
      itens: resultado.itens.map(paraResposta),
      total: resultado.total,
    };
  }

  // Precisa vir ANTES de GET /avaliacoes/:id — caso contrario "convite"
  // seria interpretado como o parametro :id da rota abaixo.
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
}
