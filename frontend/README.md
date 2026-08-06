# allu invest — Frontend (Avaliações)

React + Vite + TypeScript. SPA pura, sem SSR.

## Rodando localmente

```bash
# 1. backend (outro terminal, na pasta backend/)
pnpm run start:dev

# 2. gerar um token de teste (outro terminal, na pasta backend/)
npx ts-node -r tsconfig-paths/register src/scripts/gerar-token-teste.ts cliente cliente-teste-001

# 3. frontend
cp .env.example .env   # já vem com o default certo, só copiar
pnpm install
pnpm run dev
```

Abra `http://localhost:5173/entrar`, cole o token gerado no passo 2 e envie. Você será redirecionado para `/perfil`, que exibe os dados retornados por `GET /api/me`.

## Escopo desta etapa

Hoje o backend só expõe uma rota HTTP funcional: `GET /api/me`. Não existem controllers de avaliações, moderação ou investimentos ainda (só domínio e ports abstratas do lado do backend). Por isso, esta etapa do frontend cobre apenas:

- Bootstrap do projeto (Vite, Tailwind v4, shadcn/ui, TanStack Query, React Router, path alias `@/*`).
- Autenticação real contra `GET /api/me` (sem mock).
- Aplicação do design system fornecido.

Não há telas de submissão/moderação de avaliação — isso depende de rotas que ainda não existem no backend e será retomado quando estiverem disponíveis.

## Decisões assumidas (não estavam explícitas no desafio)

### Storage do token JWT: `sessionStorage`

O backend é um resource server puro (sem `POST /login`, sem refresh token — o JWT expira em 1h). O `AUTH_FLOW.md` do backend deixa essa decisão explicitamente em aberto para o frontend.

Escolhido `sessionStorage`, não memória pura nem `localStorage`:

- **Memória pura** (perdida a cada F5) obrigaria colar o token de novo a cada reload — ruim para uso/demo real.
- **`localStorage`** sobrevive ao fechar o navegador, criando a ilusão de uma sessão válida quando o token (sem refresh) já expirou há muito tempo, além de ampliar a janela de exposição a roubo via XSS.
- **`sessionStorage`** resolve o reload (sobrevive a F5 na mesma aba) e se autolimpa ao fechar a aba — janela de exposição compatível com a ordem de grandeza do próprio tempo de vida do token.

Único módulo que acessa `sessionStorage` diretamente: `src/features/auth/services/auth-storage.ts`.

### `email` do usuário autenticado é tratado como opcional

`AuthenticatedUser` no backend declara `email: string` (obrigatório), mas o script `gerar-token-teste.ts` assina o JWT só com `{sub, role}`. Em runtime, `payload.email` fica `undefined` e a chave some da resposta JSON de `GET /me`. O tipo `UsuarioAutenticado` no frontend (`src/features/perfil/types/me.types.ts`) reflete isso como `email?: string`, e a UI mostra "não informado" quando ausente, em vez de confiar cegamente no contrato TS do backend.

### Cliente HTTP: axios, não fetch nativo

Necessidade concreta de interceptors: injetar `Authorization: Bearer <token>` em toda chamada e reagir a `401` (limpar sessão + redirecionar) em um único lugar. `fetch` não rejeita em respostas 4xx/5xx, então um wrapper equivalente reimplementaria manualmente o que o axios já resolve.

### `react-router`, não `react-router-dom`

`react-router-dom` fica travado numa versão com CVE conhecido (CSRF em RSC Mode, GHSA-qwww-vcr4-c8h2) sem release de correção. A partir da v7, os bindings de DOM já vêm nativamente no pacote `react-router` (v8+). Todos os imports usam `from "react-router"`.

### `--color-destructive` sem token dedicado no design system

O design system fornecido não define uma cor semântica de erro/destrutivo. Usado `#B3261E` como valor pragmático em `src/index.css` (`@theme inline`) até existir um token oficial — sinalizado aqui para revisão, não escondido.

## Estrutura

```
src/
├── app/           # bootstrap: providers, rotas, query client
├── features/      # auth, perfil — cada um com components/hooks/services/types/pages
└── shared/        # ui (shadcn), lib (http client, utils), styles (tokens, fontes), types
```

Alias único `@/* → ./src/*` (cobre `@/app`, `@/features`, `@/shared`).
