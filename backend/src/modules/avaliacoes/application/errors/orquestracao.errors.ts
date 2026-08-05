// Erros desta camada nao sao invariantes do aggregate Avaliacao — sao
// falhas de orquestracao do caso de uso (ACL com o gateway de investimentos,
// traducao de dados externos). Por isso vivem em application/errors, nao em
// domain/errors, mas seguem o mesmo formato (code + name) para que o
// Exception Filter (Modulo 4) possa mapear qualquer um dos dois pra HTTP do
// mesmo jeito.
export abstract class ApplicationError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvestimentoNaoEncontradoError extends ApplicationError {
  readonly code = 'INVESTIMENTO_NAO_ENCONTRADO';

  constructor(investimentoId: string) {
    super(`Investimento ${investimentoId} nao encontrado ou nao encerrado.`);
  }
}

export class InvestimentoNaoPertenceAoClienteError extends ApplicationError {
  readonly code = 'INVESTIMENTO_NAO_PERTENCE_AO_CLIENTE';

  constructor() {
    super('Este investimento nao pertence ao cliente autenticado.');
  }
}

export class MotivoEncerramentoDesconhecidoError extends ApplicationError {
  readonly code = 'MOTIVO_ENCERRAMENTO_DESCONHECIDO';

  constructor(valorExterno: string) {
    super(
      `Motivo de encerramento desconhecido recebido do sistema externo: ${valorExterno}`,
    );
  }
}
