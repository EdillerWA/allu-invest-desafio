// Separado de prisma-client.ts de proposito: este arquivo e o unico ponto
// de import de src/generated/prisma/client.ts (onde o PrismaClient de
// verdade vive). client.ts tem `import.meta.url` em nivel de modulo
// (polyfill de __dirname pra ESM) — o ts-jest nao consegue transformar
// isso pra CommonJS, entao qualquer arquivo testado que carregue esse
// modulo, mesmo so pra pegar um export que nao seja PrismaClient, quebra a
// suite inteira com "Cannot use 'import.meta' outside a module". So
// prisma.service.ts importa daqui, e prisma.service.ts nunca e importado
// (direta ou indiretamente) por nenhum arquivo de teste — e assim que essa
// separacao continua segura.
export { PrismaClient } from '../../../generated/prisma/client';
