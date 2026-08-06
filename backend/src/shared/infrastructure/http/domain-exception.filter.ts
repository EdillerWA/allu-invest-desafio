import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '@modules/avaliacoes/domain/errors/avaliacao.errors';
import {
  ApplicationError,
  AvaliacaoNaoEncontradaError,
  ConflitoDeModeracaoError,
  IdempotencyKeyEmUsoError,
  InvestimentoNaoEncontradoError,
  InvestimentoNaoPertenceAoClienteError,
} from '@modules/avaliacoes/application/errors/orquestracao.errors';
import {
  CriterioDuplicadoError,
  LimiteDeAnexosExcedidoError,
  MotivoRejeicaoObrigatorioError,
  NenhumCriterioAvaliadoError,
  NotaForaDoIntervaloError,
  PoliticaNaoAceitaError,
  TamanhoDeAnexoInvalidoError,
  TransicaoInvalidaError,
  VersaoDePoliticaInvalidaError,
} from '@modules/avaliacoes/domain/errors/avaliacao.errors';

const FRASE_HTTP: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
};

// Recurso nao encontrado OU nao pertence a quem pediu — as duas viram 404,
// nunca 403, para nao confirmar a um atacante que o recurso existe
// (enumeration attack), conforme decisao ja documentada nos handlers destes
// erros.
const ERROS_404 = [
  AvaliacaoNaoEncontradaError,
  InvestimentoNaoPertenceAoClienteError,
  InvestimentoNaoEncontradoError,
];

// Conflito de estado (chave de idempotencia em uso por outro dono, ou
// moderacao concorrente que ja mudou o status), nao "nao encontrado" nem
// "requisicao invalida".
const ERROS_409 = [IdempotencyKeyEmUsoError, ConflitoDeModeracaoError];

// Violacoes de invariante de dominio ou de pre-condicao do caso de uso —
// sempre culpa do payload/estado enviado pelo cliente.
const ERROS_400 = [
  TransicaoInvalidaError,
  NotaForaDoIntervaloError,
  CriterioDuplicadoError,
  PoliticaNaoAceitaError,
  NenhumCriterioAvaliadoError,
  MotivoRejeicaoObrigatorioError,
  LimiteDeAnexosExcedidoError,
  TamanhoDeAnexoInvalidoError,
  VersaoDePoliticaInvalidaError,
];

function statusParaErroDeDominio(
  erro: DomainError | ApplicationError,
): HttpStatus {
  if (ERROS_404.some((Classe) => erro instanceof Classe)) {
    return HttpStatus.NOT_FOUND;
  }
  if (ERROS_409.some((Classe) => erro instanceof Classe)) {
    return HttpStatus.CONFLICT;
  }
  if (ERROS_400.some((Classe) => erro instanceof Classe)) {
    return HttpStatus.BAD_REQUEST;
  }
  // Erro de dominio/aplicacao real, mas sem mapeamento HTTP explicito ainda
  // (ex: MotivoEncerramentoDesconhecidoError, que reflete dado inconsistente
  // vindo de um sistema externo, nao uma falha do cliente desta API).
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

// Unico ponto de traducao entre os erros de dominio/aplicacao (sem nenhuma
// dependencia de HTTP, de proposito) e o protocolo HTTP. Registrado global
// em main.ts via app.useGlobalFilters(...).
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(erro: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    // Excecoes que ja sao HttpException (ValidationPipe global, guards de
    // auth/RBAC, ParseFilePipe de upload) ja sabem seu proprio status e
    // corpo de resposta — repassa como esta, sem reinterpretar.
    if (erro instanceof HttpException) {
      response.status(erro.getStatus()).json(erro.getResponse());
      return;
    }

    if (erro instanceof DomainError || erro instanceof ApplicationError) {
      const status = statusParaErroDeDominio(erro);
      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `Erro de dominio/aplicacao sem mapeamento HTTP (${erro.constructor.name}): ${erro.message}`,
          erro.stack,
        );
      }
      response.status(status).json({
        statusCode: status,
        error: FRASE_HTTP[status],
        message: erro.message,
        code: erro.code,
      });
      return;
    }

    // Qualquer outra coisa (falha de infraestrutura como
    // PersistenciaIndisponivelError/PersistenciaFalhouError, ou um erro
    // realmente inesperado): loga o detalhe completo so no servidor,
    // devolve mensagem generica ao cliente — nunca stack trace, string de
    // conexao ou nome de tabela/coluna na resposta HTTP.
    this.logger.error(
      erro instanceof Error
        ? erro.message
        : `Erro nao tratado: ${String(erro)}`,
      erro instanceof Error ? erro.stack : undefined,
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: FRASE_HTTP[HttpStatus.INTERNAL_SERVER_ERROR],
      message: 'Erro interno do servidor.',
    });
  }
}
