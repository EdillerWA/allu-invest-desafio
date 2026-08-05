export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class TransicaoInvalidaError extends DomainError {
  readonly code = 'TRANSICAO_INVALIDA';

  constructor(statusAtual: string, statusDestino: string) {
    super(
      `Nao e possivel transicionar de ${statusAtual} para ${statusDestino}.`,
    );
  }
}

export class NotaForaDoIntervaloError extends DomainError {
  readonly code = 'NOTA_FORA_DO_INTERVALO';

  constructor(nota: number) {
    super(`A nota ${nota} esta fora do intervalo permitido (1 a 5).`);
  }
}

export class CriterioDuplicadoError extends DomainError {
  readonly code = 'CRITERIO_DUPLICADO';

  constructor(criterio: string) {
    super(`O criterio ${criterio} ja foi avaliado nesta avaliacao.`);
  }
}

export class PoliticaNaoAceitaError extends DomainError {
  readonly code = 'POLITICA_NAO_ACEITA';

  constructor() {
    super('E necessario aceitar a politica de avaliacoes para submeter.');
  }
}

export class NenhumCriterioAvaliadoError extends DomainError {
  readonly code = 'NENHUM_CRITERIO_AVALIADO';

  constructor() {
    super(
      'E necessario avaliar ao menos um criterio para submeter a avaliacao.',
    );
  }
}

export class MotivoRejeicaoObrigatorioError extends DomainError {
  readonly code = 'MOTIVO_REJEICAO_OBRIGATORIO';

  constructor() {
    super('E obrigatorio informar o motivo ao rejeitar uma avaliacao.');
  }
}

export class LimiteDeAnexosExcedidoError extends DomainError {
  readonly code = 'LIMITE_DE_ANEXOS_EXCEDIDO';

  constructor() {
    super('Uma avaliacao pode ter no maximo 3 anexos.');
  }
}

export class TamanhoDeAnexoInvalidoError extends DomainError {
  readonly code = 'TAMANHO_DE_ANEXO_INVALIDO';

  constructor(tamanhoBytes: number) {
    super(
      `O tamanho do anexo (${tamanhoBytes} bytes) deve ser maior que zero e nao pode exceder 5MB.`,
    );
  }
}

export class VersaoDePoliticaInvalidaError extends DomainError {
  readonly code = 'VERSAO_DE_POLITICA_INVALIDA';

  constructor() {
    super('A versao da politica aceita nao pode ser vazia.');
  }
}
