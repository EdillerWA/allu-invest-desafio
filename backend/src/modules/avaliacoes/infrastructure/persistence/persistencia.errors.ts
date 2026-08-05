// Erros desta camada existem pra nunca deixar uma excecao crua do Prisma
// (stack trace de biblioteca, mensagem interna do Postgres) vazar pra
// quem chama o repositorio. Nao seguem o padrao ApplicationError/code:
// sao falha de infraestrutura, nao de orquestracao de caso de uso — o
// Exception Filter do Modulo 4 trata qualquer erro nao mapeado como 500
// generico, e isso ja e o comportamento correto aqui (nao existe status
// HTTP mais especifico que 500 pra "banco fora do ar").
export class PersistenciaIndisponivelError extends Error {
  constructor() {
    super('Nao foi possivel conectar ao banco de dados.');
    this.name = 'PersistenciaIndisponivelError';
  }
}

export class PersistenciaFalhouError extends Error {
  constructor(codigoPrisma: string) {
    super(`Falha ao persistir dados (codigo Prisma: ${codigoPrisma}).`);
    this.name = 'PersistenciaFalhouError';
  }
}
