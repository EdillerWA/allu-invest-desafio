# Modelo de Dados — Avaliação de Experiência de Investimento

Este documento explica o schema Prisma: o que cada tabela representa, por que existe, e por que os campos foram modelados dessa forma. Serve como referência para quem for revisar o código e como registro das decisões tomadas.

## Visão geral

```
Avaliacao (1) ──< NotaCriterio (N)
Avaliacao (1) ──< Anexo (N)
Avaliacao (1) ──< AuditLogAvaliacao (N)
```

Uma única tabela agregadora (`Avaliacao`) com três tabelas filhas. Nenhuma tabela depende de duas tabelas ao mesmo tempo — cada relação é uma árvore simples a partir do aggregate root, o que mantém as escritas previsíveis: uma avaliação e tudo que pertence a ela é gravado e apagado junto (`onDelete: Cascade`).

## `Avaliacao`

Aggregate root do domínio. Representa a avaliação de experiência de um cliente sobre um investimento que já foi encerrado.

### Identidade e relação com o contexto externo

```prisma
investimentoId String @unique
clienteId      String
```

`investimentoId` é único porque a regra de negócio é: **um investimento encerrado só pode ser avaliado uma vez**. Essa constraint no banco é a primeira camada de idempotência do sistema — mesmo que a aplicação tenha um bug e tente criar duas avaliações para o mesmo investimento, o banco recusa.

`clienteId` não tem `@unique` porque um mesmo cliente pode ter vários investimentos e, portanto, várias avaliações.

### Snapshot do investimento

```prisma
investimentoTipoProduto        String
investimentoValorAplicado      Decimal @db.Decimal(18, 2)
investimentoDataAplicacao      DateTime
investimentoDataEncerramento   DateTime
investimentoMotivoEncerramento MotivoEncerramento
```

Este é o ponto de maior peso arquitetural do schema. A alternativa óbvia seria guardar só o `investimentoId` e buscar os dados do investimento ao vivo, sempre que a avaliação precisar ser exibida, consultando o contexto `investimentos`.

Essa alternativa cria dois problemas:

1. **Disponibilidade acoplada**: se o serviço de investimentos estiver fora do ar, a avaliação fica ilegível, mesmo já tendo sido submetida e aprovada.
2. **Integridade histórica**: se o dado do investimento mudar ou for arquivado depois, a avaliação passa a mostrar informação diferente da que o cliente viu no momento em que avaliou.

Congelar um snapshot no momento em que o convite de avaliação é gerado resolve os dois problemas. Isso é a aplicação prática de um Anti-Corruption Layer: o contexto `avaliacoes` não confia que o contexto `investimentos` vai continuar disponível ou inalterado — ele captura o que precisa e segue independente.

`Decimal(18, 2)` em vez de `Float` para o valor aplicado: ponto flutuante binário não representa valores monetários com exatidão (erros de arredondamento acumulam). `Decimal` é o tipo correto para dinheiro em qualquer sistema financeiro.

### Estado

```prisma
status StatusAvaliacao @default(RASCUNHO)
```

```
RASCUNHO → ENVIADA → EM_MODERACAO → APROVADA
                                   → REJEITADA
```

Cinco estados, cada transição validada na camada de domínio (não é um enum solto que qualquer código pode sobrescrever livremente — as regras de transição vivem na entidade `Avaliacao`, fora deste documento de schema).

### Conteúdo

```prisma
comentario String? @db.Text
```

Campo opcional: o requisito mínimo do desafio pede "comentários do cliente", mas não define se é obrigatório. Decisão documentada: comentário é opcional, porque exigi-lo tornaria a submissão de uma avaliação só com notas impossível, o que reduziria a taxa de resposta em produção — pessoas costumam preencher notas com mais frequência do que texto livre.

`@db.Text` em vez do `String` padrão (que vira `VARCHAR` com limite) porque comentário de experiência não deveria ter teto arbitrário de caracteres.

### Aceite de política

```prisma
politicaVersaoAceita String
politicaAceitaEm     DateTime?
```

Guardar apenas um `aceitouPolitica: Boolean` foi descartado deliberadamente. Se a política de avaliações for revisada no futuro (nova versão dos termos), um boolean solto não diz qual texto a pessoa realmente leu e aceitou. Guardar a versão explícita (ex: `"v1.2"`) permite reconstruir exatamente o que estava em vigor quando o aceite aconteceu — relevante em qualquer disputa ou auditoria posterior.

### Idempotência

```prisma
idempotencyKey String? @unique
```

Segunda camada de idempotência, complementar ao `@unique` em `investimentoId`. A constraint de `investimentoId` já resolve duplicidade de negócio (não posso ter duas avaliações do mesmo investimento). Esta coluna resolve duplicidade de requisição: se o cliente clicar duas vezes no botão de enviar, ou a rede retentar a chamada, o backend reconhece a mesma `idempotencyKey` e retorna o resultado já persistido, em vez de tentar processar de novo.

Optei por resolver isso no próprio aggregate, sem tabela ou cache externo dedicado (o padrão genérico de Idempotency-Key envolveria armazenamento, expiração e replay de resposta cacheada). Como a duplicidade real, neste sistema, só existe no ponto de submissão da avaliação, uma coluna única já é suficiente — decisão de escopo justificada por custo-benefício, não por desconhecimento do padrão completo.

### Auditoria de escrita

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

Timestamps técnicos padrão, preenchidos automaticamente pelo Prisma. Diferente da tabela `AuditLogAvaliacao` (histórico de eventos de negócio), estes dois campos só dizem quando o registro foi criado e a última vez que qualquer coluna dele mudou — não dizem o quê mudou nem quem mudou.

### Índices

```prisma
@@index([clienteId])
@@index([status])
```

`clienteId`: toda consulta de "minhas avaliações" (visão do cliente) filtra por esse campo — sem índice, seria varredura completa da tabela conforme o volume cresce.

`status`: a fila de moderação consulta `WHERE status = 'EM_MODERACAO'` — mesma lógica.

## `NotaCriterio`

```prisma
criterio TipoCriterio
nota     Int
@@unique([avaliacaoId, criterio])
```

O desafio pede "critérios de avaliação utilizando notas", no plural. Um único campo `notaGeral: Int` na tabela `Avaliacao` não atenderia esse requisito com fidelidade — o esperado é que a experiência seja avaliada em múltiplas dimensões (atendimento, clareza da informação, facilidade de resgate, etc.), cada uma com sua própria nota.

Por isso, tabela filha em vez de campo único: cada linha é uma dimensão avaliada. A constraint `@@unique([avaliacaoId, criterio])` impede que o mesmo critério seja registrado duas vezes na mesma avaliação — proteção de integridade que uma lista solta em JSON não teria no nível do banco.

`TipoCriterio` é um enum fixo (cinco critérios pré-definidos) e não uma tabela de catálogo configurável. Decisão de escopo explícita: uma tabela de catálogo permitiria o time de produto cadastrar novos critérios sem precisar de deploy, o que é mais flexível — mas essa flexibilidade não é exigida pelo desafio e custaria tempo de implementação (CRUD de critérios, migração de dados históricos se um critério for descontinuado) que não se paga dentro do escopo.

## `Anexo`

```prisma
nomeOriginal         String
caminhoArmazenamento String
tipoMime             String
tamanhoBytes         Int
```

O desafio permite anexos opcionais, por isso é tabela filha (zero a N linhas), não um campo na tabela principal.

`caminhoArmazenamento` guarda apenas o caminho/chave do arquivo, não o arquivo em si — o binário fica em um storage separado (sistema de arquivos local em desenvolvimento, S3 ou equivalente em produção). Essa separação é o que permite trocar o mecanismo de armazenamento sem alterar o schema do banco: a tabela só guarda a referência.

`tipoMime` e `tamanhoBytes` existem para validação e exibição no frontend sem precisar abrir o arquivo — uma interface pode decidir mostrar ícone de PDF vs. imagem, ou rejeitar exibição de um arquivo grande demais, só lendo a linha do banco.

## `AuditLogAvaliacao`

```prisma
acao     AcaoAuditoria
atorId   String?
atorRole RoleUsuario?
motivo   String? @db.Text
metadata Json?
criadoEm DateTime @default(now())
```

Tabela de trilha de auditoria, append-only por design: o código de aplicação nunca deve fazer `UPDATE` ou `DELETE` nela, apenas `INSERT`. Cada linha é um fato histórico imutável — "esta ação aconteceu, por este ator, neste momento."

Isso é diferente dos Domain Events que o sistema publica internamente (via `EventEmitter`). Eventos de domínio são efêmeros: publicados, escutados por quem precisar reagir, e descartados — não ficam armazenados em lugar nenhum por padrão. Esta tabela é o oposto: existe justamente para persistir e ser consultável depois, por exemplo, para responder "quem aprovou esta avaliação e quando" numa investigação ou auditoria.

Também não é Event Sourcing. Neste sistema, o estado atual da `Avaliacao` vive nas colunas normais da tabela (`status`, `comentario`, etc.) — não é reconstruído a partir do log. O `AuditLogAvaliacao` é um rastro histórico ao lado do estado atual, não a fonte de verdade dele.

`atorId` e `atorRole` são opcionais porque nem toda ação tem um humano por trás — uma transição de estado disparada automaticamente pelo sistema (por exemplo, uma expiração de prazo) não tem ator humano, mas ainda merece registro.

`motivo` existe principalmente para o caso de rejeição pelo moderador — a obrigatoriedade desse campo quando `acao = REJEITADA` é validada na camada de aplicação (use case), não pelo banco. Regra de negócio condicional como essa não pertence à camada de persistência; o schema permite o campo nulo porque, para as outras ações, ele de fato não se aplica.

`metadata` é um campo `Json` de escape — guarda um snapshot leve e não estruturado do contexto relevante no momento da ação (por exemplo, quais notas foram atribuídas na submissão), evitando que toda consulta de auditoria precise fazer join com várias outras tabelas para reconstruir o que aconteceu.

## O que foi deixado fora, e por quê

| Alternativa considerada | Por que não foi usada |
|---|---|
| Guardar apenas `investimentoId`, sem snapshot | Acopla a disponibilidade da avaliação à disponibilidade contínua do serviço de investimentos |
| `notaGeral: Int` único na tabela `Avaliacao` | Não atende ao requisito de múltiplos critérios de avaliação |
| Tabela de catálogo configurável para critérios | Fora do escopo de 7 horas; enum fixo resolve o requisito mínimo |
| `aceitouPolitica: Boolean` | Não preserva qual versão da política foi de fato aceita |
| Idempotency-Key genérico com cache e TTL | Resolveria duplicidade em qualquer endpoint; aqui a duplicidade real só existe na submissão, então a constraint no próprio aggregate já é suficiente |
| Event Sourcing como fonte de verdade do estado | Mudaria todo o modelo de persistência sem ganho proporcional ao escopo do desafio |
