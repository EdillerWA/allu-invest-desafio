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

export class AvaliacaoNaoEncontradaError extends ApplicationError {
  readonly code = 'AVALIACAO_NAO_ENCONTRADA';

  constructor(avaliacaoId: string) {
    super(`Avaliacao ${avaliacaoId} nao encontrada.`);
  }
}

// Ocorre quando a constraint unica de idempotencyKey (global no banco, nao
// por cliente) e violada por uma chave que ja pertence a OUTRO cliente — o
// RLS entao filtra a linha na reconsulta de reconciliacao (o dono da linha
// nao e quem esta pedindo), entao o handler nao consegue devolver a
// avaliacao existente como faria numa corrida legitima do mesmo cliente.
// Mapeamento HTTP correto no Modulo 4: 409 (Conflict) — nao 404 (a chave
// existe, so nao pertence a este cliente), nao 400 (nao e erro de
// validacao de payload), nao 500 (nao e falha de infraestrutura).
export class IdempotencyKeyEmUsoError extends ApplicationError {
  readonly code = 'IDEMPOTENCY_KEY_EM_USO';

  constructor() {
    super('Esta chave de idempotencia ja esta em uso por outra avaliacao.');
  }
}

// Duas acoes de moderacao concorrentes sobre a mesma avaliacao: o
// repositorio so aplica o UPDATE se o status no banco ainda for o mesmo que
// foi lido antes da transicao (ver PrismaAvaliacaoRepository.salvar). Se a
// segunda requisicao chegar depois que a primeira ja mudou o status, o
// UPDATE afeta 0 linhas e o repositorio lanca este erro em vez de
// sobrescrever silenciosamente o resultado da primeira.
export class ConflitoDeModeracaoError extends ApplicationError {
  readonly code = 'CONFLITO_DE_MODERACAO';

  constructor(avaliacaoId: string) {
    super(
      `Avaliacao ${avaliacaoId} ja foi moderada por outra requisicao concorrente.`,
    );
  }
}
