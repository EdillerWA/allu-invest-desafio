import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import {
  AvaliacaoNaoEncontradaError,
  IdempotencyKeyEmUsoError,
  InvestimentoNaoEncontradoError,
  InvestimentoNaoPertenceAoClienteError,
  MotivoEncerramentoDesconhecidoError,
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
import { PersistenciaIndisponivelError } from '@modules/avaliacoes/infrastructure/persistence/persistencia.errors';

function criarHostMock() {
  const json = jest.fn<void, [unknown]>();
  const status = jest.fn<{ json: typeof json }, [number]>(() => ({ json }));
  const getResponse = jest.fn(() => ({ status }));
  const host = {
    switchToHttp: () => ({ getResponse }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('DomainExceptionFilter', () => {
  it.each([
    ['AvaliacaoNaoEncontradaError', new AvaliacaoNaoEncontradaError('id-1')],
    [
      'InvestimentoNaoPertenceAoClienteError',
      new InvestimentoNaoPertenceAoClienteError(),
    ],
    [
      'InvestimentoNaoEncontradoError',
      new InvestimentoNaoEncontradoError('inv-1'),
    ],
  ])('%s vira 404', (_nome, erro) => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = criarHostMock();

    filtro.catch(erro, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        code: erro.code,
      }),
    );
  });

  it('IdempotencyKeyEmUsoError vira 409', () => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = criarHostMock();
    const erro = new IdempotencyKeyEmUsoError();

    filtro.catch(erro, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        code: 'IDEMPOTENCY_KEY_EM_USO',
      }),
    );
  });

  it.each([
    [
      'TransicaoInvalidaError',
      new TransicaoInvalidaError('ENVIADA', 'RASCUNHO'),
    ],
    ['NotaForaDoIntervaloError', new NotaForaDoIntervaloError(9)],
    ['CriterioDuplicadoError', new CriterioDuplicadoError('ATENDIMENTO')],
    ['PoliticaNaoAceitaError', new PoliticaNaoAceitaError()],
    ['NenhumCriterioAvaliadoError', new NenhumCriterioAvaliadoError()],
    ['MotivoRejeicaoObrigatorioError', new MotivoRejeicaoObrigatorioError()],
    ['LimiteDeAnexosExcedidoError', new LimiteDeAnexosExcedidoError()],
    ['TamanhoDeAnexoInvalidoError', new TamanhoDeAnexoInvalidoError(999)],
    ['VersaoDePoliticaInvalidaError', new VersaoDePoliticaInvalidaError()],
  ])('%s vira 400', (_nome, erro) => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = criarHostMock();

    filtro.catch(erro, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        code: erro.code,
      }),
    );
  });

  it('erro de aplicacao sem mapeamento explicito (MotivoEncerramentoDesconhecidoError) vira 500, sem vazar detalhe', () => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = criarHostMock();
    const erro = new MotivoEncerramentoDesconhecidoError('VALOR_ESTRANHO');

    filtro.catch(erro, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
      }),
    );
  });

  it('PersistenciaIndisponivelError (falha de infra) vira 500 generico, sem vazar mensagem interna', () => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = criarHostMock();
    const erro = new PersistenciaIndisponivelError();

    filtro.catch(erro, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    // Assercao exata (nao objectContaining): garante que a UNICA mensagem
    // enviada ao cliente e a generica — se a mensagem real do erro ("Nao
    // foi possivel conectar ao banco de dados.") vazasse pra resposta,
    // esta comparacao exata falharia.
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Erro interno do servidor.',
    });
  });

  it('erro inesperado com stack trace, path de disco e string de conexao no message nao vaza NADA disso na resposta', () => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = criarHostMock();
    const erroComDetalheSensivel = new Error(
      'connect ECONNREFUSED postgresql://allu_invest_app:senha-secreta@localhost:5433/allu_invest',
    );
    erroComDetalheSensivel.stack =
      'Error: connect ECONNREFUSED\n    at C:\\PROJETOS\\allu-invest-desafio\\backend\\node_modules\\pg-pool\\index.js:45:11';

    filtro.catch(erroComDetalheSensivel, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    // Corpo exato — nao objectContaining: garante que NENHUM campo extra
    // (nem "stack", nem um "message" com o detalhe real) escapa pro corpo
    // json enviado ao cliente.
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Erro interno do servidor.',
    });
    const corpoEnviado = json.mock.calls[0]?.[0];
    expect(JSON.stringify(corpoEnviado)).not.toContain('senha-secreta');
    expect(JSON.stringify(corpoEnviado)).not.toContain('pg-pool');
    expect(JSON.stringify(corpoEnviado)).not.toContain('ECONNREFUSED');
  });

  it('erro totalmente inesperado (nao Error) vira 500 generico, sem crashar o filtro', () => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = criarHostMock();

    filtro.catch('uma string qualquer lancada por engano', host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Erro interno do servidor.',
    });
  });

  it('HttpException (ex: do ValidationPipe global) e repassada com seu proprio status e corpo, sem reinterpretar', () => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = criarHostMock();
    const erro = new BadRequestException(['campo invalido']);

    filtro.catch(erro, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(erro.getResponse());
  });

  it('UnauthorizedException (do JwtAuthGuard) vira 401, nao e engolida pelo catch-all generico de 500', () => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = criarHostMock();
    const erro = new UnauthorizedException('Token invalido ou ausente.');

    filtro.catch(erro, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith(erro.getResponse());
  });

  it('ForbiddenException (do RolesGuard) vira 403, nao e engolida pelo catch-all generico de 500', () => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = criarHostMock();
    const erro = new ForbiddenException('Forbidden resource');

    filtro.catch(erro, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(json).toHaveBeenCalledWith(erro.getResponse());
  });
});
