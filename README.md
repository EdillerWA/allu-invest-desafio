# allu invest — Avaliação de Experiência de Investimento

Desafio técnico para vaga de Desenvolvedor(a) Full Stack Pleno na allu: clientes avaliam investimentos já encerrados (nota por critério, comentário, anexos), e as avaliações passam por moderação antes de qualquer publicação.

## Status

- [x] Setup de infraestrutura (Docker, PostgreSQL, Prisma, NestJS, Vite)
- [x] Schema de dados (avaliações, notas por critério, anexos, log de auditoria)
- [x] Autenticação e autorização (JWT RS256, RBAC) — backend
- [x] Domínio (aggregate `Avaliacao`, state machine, regras de negócio)
- [x] Casos de uso (submeter, aprovar, rejeitar, listar, obter convite)
- [x] Persistência real com Row-Level Security (Postgres RLS) ativo
- [x] API REST (controllers, DTOs, exception filter global)
- [x] Testes automatizados do backend (124 unitários + e2e real contra guards/exception filter)
- [x] Frontend (React) — submissão, painel de moderação, listagem de avaliações e tela de detalhe, todos funcionais ponta a ponta contra o backend real
- [x] Documentação final de decisões arquiteturais consolidada (`RELATORIO_DECISOES.md`)

O backend está funcionalmente completo e testado (unitário + e2e + manual ponta a ponta, incluindo prova de concorrência real). O frontend cobre as quatro telas de negócio (submissão, moderação, listagem, detalhe), com teste automatizado cobrindo carregamento/erro/vazio/sucesso e validação manual contra o backend real — histórico completo do corte de escopo original e do fechamento posterior em `RELATORIO_DECISOES.md`.

## Stack

- **Backend**: NestJS 11 + TypeScript, Prisma ORM 7 (driver adapter `@prisma/adapter-pg`), PostgreSQL 16
- **Frontend**: React 19 + TypeScript + Vite, TanStack Query, React Hook Form + Zod, Tailwind + shadcn/ui
- **Infra local**: Docker Compose (só o Postgres — não há mais nada containerizado)
- **Auth**: JWT RS256, modelo resource-server (esta API não emite token — ver `backend/docs/AUTH_FLOW.md`)

## Arquitetura, em uma frase

DDD-flavored, monolito modular por bounded context (`identity`, `avaliacoes`, `investimentos`), com `domain/` → `application/` (commands/queries + handlers, sem `@nestjs/cqrs`) → `infrastructure/` → `presentation/` (controllers/DTOs) em cada módulo. Detalhes e porquês:

- `RELATORIO_DECISOES.md` — premissas assumidas, decisões de arquitetura e cortes de escopo de todo o projeto, com a justificativa de cada um.
- `backend/docs/AUTH_FLOW.md` — por que Bearer token, por que sem `/login`, o que foi testado e como.
- `backend/docs/DATA_MODEL.md` — schema Prisma, por que snapshot do investimento é congelado na avaliação, por que RLS.
- `backend/docs/ACHADOS_PENDENTES.md` — registro histórico de 2 lacunas encontradas durante o desenvolvimento (motivo de rejeição não persistido, moderação concorrente sem lock), ambas corrigidas depois — ver `RELATORIO_DECISOES.md`.

---

## Pré-requisitos

- Node.js 20+, [pnpm](https://pnpm.io/) instalado (`corepack enable` resolve na maioria dos casos)
- Docker Desktop rodando
- OpenSSL disponível no PATH (para gerar o par de chaves JWT de teste — vem por padrão no Git Bash/WSL/Linux/macOS)

## Setup — do zero até rodando

### 1. Suba o Postgres

Na raiz do repositório:

```bash
docker compose up -d
```

Confirma que subiu:

```bash
docker exec -it allu-invest-postgres pg_isready -U postgres
```

### 2. Instale as dependências do backend

```bash
cd backend
pnpm install
```

### 3. Gere o par de chaves RS256 de teste

Esta API é um *resource server* puro — ela não emite tokens, só verifica. Para desenvolvimento local, simulamos o Identity Provider gerando um par de chaves local:

```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

`keys/` já está no `.gitignore` — a chave privada nunca deve ir pro repositório (em produção, ela nem existiria aqui: ficaria no IdP real).

### 4. Configure o `.env`

```bash
cp .env.example .env
```

Edite `.env`:

- Cole o conteúdo de `keys/public.pem` (gerado no passo anterior) dentro de `JWT_PUBLIC_KEY`, mantendo as linhas `-----BEGIN PUBLIC KEY-----` / `-----END PUBLIC KEY-----`.
- Troque o placeholder de senha em `RUNTIME_DATABASE_URL` para `troque-esta-senha-em-producao` — é a senha que a migration de RLS usa para criar o role restrito `allu_invest_app` (veja `prisma/migrations/20260805170000_rls_avaliacoes/migration.sql`). Se preferir outra senha, mude nos dois lugares (`.env` e a migration) antes de rodar o passo 5.

### 5. Rode as migrations

```bash
pnpm run prisma:generate
pnpm run prisma:migrate
```

A primeira migration cria o schema; a segunda (`20260805170000_rls_avaliacoes`) cria um role Postgres restrito (`allu_invest_app`, sem privilégio de superuser — necessário porque superuser ignora RLS) e ativa Row-Level Security nas tabelas `avaliacoes`, `notas_criterio` e `anexos`.

### 6. Suba o backend

```bash
pnpm run start:dev
```

Sobe em `http://localhost:3000/api`. Log de sucesso esperado: `Nest application successfully started` + a lista de rotas mapeadas.

---

## Testando

### Testes automatizados (unitários)

```bash
cd backend
pnpm run build   # confirma que compila
pnpm run lint    # zero warnings/erros
pnpm test        # 124 testes, todos unitários (mocks nas portas — sem tocar banco real)
pnpm run test:e2e  # 3 testes, app real de ponta a ponta (guards, prefixo /api, exception filter)
```

### Fluxo manual completo (ponta a ponta, contra o servidor real)

Com o backend rodando (passo 6 acima) e o Postgres em pé, gere tokens de teste:

```bash
# de dentro de backend/
npx ts-node -r tsconfig-paths/register src/scripts/gerar-token-teste.ts cliente cliente-teste-001
npx ts-node -r tsconfig-paths/register src/scripts/gerar-token-teste.ts cliente cliente-teste-002
npx ts-node -r tsconfig-paths/register src/scripts/gerar-token-teste.ts moderador moderador-teste-001
```

Não existe seed de investimentos "de verdade" — o contexto `investimentos` é simulado por um gateway com 3 fixtures fixas (`MockInvestimentoGatewayAdapter`), pensadas pra cobrir os cenários abaixo:

| `investimentoId` | dono (`clienteId`) | produto |
|---|---|---|
| `investimento-001` | `cliente-teste-001` | CDB Pós-fixado |
| `investimento-002` | `cliente-teste-002` | LCI |
| `investimento-003` | `cliente-teste-001` | Tesouro Selic |

Salve os 3 tokens em variáveis e siga o fluxo:

```bash
TOKEN_A="<token do cliente-teste-001>"
TOKEN_B="<token do cliente-teste-002>"
TOKEN_MOD="<token do moderador>"

# 1. Ver o convite (dados do investimento antes de avaliar)
curl http://localhost:3000/api/avaliacoes/convite/investimento-001 \
  -H "Authorization: Bearer $TOKEN_A"

# 2. Submeter avaliação (com 1 anexo PDF opcional)
curl -X POST http://localhost:3000/api/avaliacoes \
  -H "Authorization: Bearer $TOKEN_A" \
  -F "investimentoId=investimento-001" \
  -F "notas[0][criterio]=ATENDIMENTO" \
  -F "notas[0][valor]=5" \
  -F "comentario=Otima experiencia" \
  -F "versaoPolitica=v1"
# guarde o "id" retornado

# 3. Ver a própria avaliação
curl http://localhost:3000/api/avaliacoes/<id> -H "Authorization: Bearer $TOKEN_A"

# 4. Cliente B tentando ver a avaliação de A -> 404 (nunca 403, anti-enumeração deliberada)
curl -i http://localhost:3000/api/avaliacoes/<id> -H "Authorization: Bearer $TOKEN_B"

# 5. Cliente tentando acessar rota de moderador -> 403 (RBAC de papel, diferente do 404 acima)
curl -i http://localhost:3000/api/moderacao/pendentes -H "Authorization: Bearer $TOKEN_A"

# 6. Moderador aprova
curl -X POST http://localhost:3000/api/moderacao/<id>/aprovar -H "Authorization: Bearer $TOKEN_MOD"

# 7. Fluxo de rejeição (outra avaliação, outro investimento)
curl -X POST http://localhost:3000/api/avaliacoes \
  -H "Authorization: Bearer $TOKEN_A" \
  -F "investimentoId=investimento-003" \
  -F "notas[0][criterio]=RENTABILIDADE_PERCEBIDA" \
  -F "notas[0][valor]=2" \
  -F "versaoPolitica=v1"
curl -X POST http://localhost:3000/api/moderacao/<id-da-nova>/rejeitar \
  -H "Authorization: Bearer $TOKEN_MOD" -H "Content-Type: application/json" \
  -d '{"motivo": "Comentario nao condiz com a nota"}'
```

Critérios válidos para `notas[].criterio`: `ATENDIMENTO`, `CLAREZA_INFORMACOES`, `FACILIDADE_RESGATE`, `RENTABILIDADE_PERCEBIDA`, `RECOMENDARIA_A_OUTROS` (nota inteira de 1 a 5). Anexos: até 3 arquivos, 5MB cada, PDF/JPEG/PNG validados por conteúdo real do arquivo (magic number), não por extensão.

### Rotas disponíveis

Todas sob o prefixo `/api`. Autenticação via `Authorization: Bearer <token>` em todas exceto onde indicado.

| Método | Rota | Quem | O que faz |
|---|---|---|---|
| GET | `/me` | qualquer autenticado | dados do usuário autenticado |
| POST | `/avaliacoes` | cliente | submete avaliação (multipart, anexos opcionais) |
| GET | `/avaliacoes` | cliente | lista as próprias avaliações (paginado, `?pagina=&tamanhoPagina=`, máx. 50) |
| GET | `/avaliacoes/convite/:investimentoId` | cliente | dados do investimento + avaliação existente (se houver) |
| GET | `/avaliacoes/:id` | cliente (dono) | detalhe de uma avaliação — 404 se não existe ou não é sua |
| GET | `/moderacao/pendentes` | moderador | fila de avaliações aguardando moderação (paginado) |
| POST | `/moderacao/:id/aprovar` | moderador | aprova |
| POST | `/moderacao/:id/rejeitar` | moderador | rejeita (`{"motivo": "..."}` obrigatório) |

## Frontend

O frontend vive em `frontend/`, já mesclado em `main`. Bootstrap completo (Vite, Tailwind, shadcn/ui, TanStack Query, roteamento), autenticação real contra `GET /api/me` (tela de login cola o token gerado pelo script acima), e as quatro telas de negócio funcionais:

- `/investimentos/:investimentoId/avaliar` — convite e submissão: informações do investimento, notas por critério, comentário, upload de anexo e aceite de política via `POST /avaliacoes`; mostra o status (incluindo motivo, se rejeitada) quando já existe avaliação para aquele investimento, em vez do formulário.
- `/minhas-avaliacoes` — listagem paginada das próprias avaliações do cliente.
- `/avaliacoes/:id` — detalhe de uma avaliação (notas, comentário, anexos, motivo de rejeição quando houver); 404 genérico se não existe ou não pertence ao cliente autenticado.
- `/moderacao` — painel de moderação (fila paginada, aprovar, rejeitar com motivo obrigatório), atrás de `RoleGuardedRoute` — só usuário com papel `MODERADOR` acessa, os demais são redirecionados.

Teste automatizado (Vitest + MSW, backend real nunca tocado) cobre carregamento, erro, estado vazio e sucesso das três telas mais recentes, incluindo o tratamento do conflito de moderação concorrente (409) como caso de erro distinto, não genérico.

Para rodar:

```bash
cd frontend
cp .env.example .env   # já aponta pra http://localhost:3000/api
pnpm install
pnpm run dev
pnpm test:run           # 16 testes
```

Abre em `http://localhost:5173`. Precisa do backend rodando (seção anterior).

## Autor

Ediller Watzek Aureliano
