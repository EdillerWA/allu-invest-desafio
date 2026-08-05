// Reexporta so o namespace Prisma (erros como PrismaClientKnownRequestError,
// tipos como TransactionClient) — nunca o PrismaClient em si. Ver
// prisma-runtime-client.ts pra saber por que os dois moram em arquivos
// separados, nao um so com duas linhas de export: o problema nao e QUAL
// export voce usa, e que carregar o ARQUIVO inteiro (pra pegar qualquer
// export dele) ja avalia todas as linhas de import de nivel de modulo,
// PrismaClient incluido, mesmo que ele nunca seja de fato referenciado.
import * as Prisma from '../../../generated/prisma/internal/prismaNamespace';
export { Prisma };
