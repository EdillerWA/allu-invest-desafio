# Relatório de Decisões Técnicas

Este documento reúne as premissas que assumi, as decisões de arquitetura que tomei e os cortes de escopo que fiz ao longo do desenvolvimento deste desafio, com a justificativa de cada um.

## Sobre a documentação em si

Em algum momento do projeto defini que a pasta docs ficaria fora do controle de versão, junto com um README provisório na raiz. O .gitignore foi ajustado com a regra docs/. Mais tarde criei dois documentos dentro de backend/docs (AUTH_FLOW.md e DATA_MODEL.md) e referenciei os dois no README principal.

Percebi depois, ao investigar um problema parecido no frontend, que a regra docs/ no .gitignore, sem barra inicial, exclui qualquer pasta com esse nome em qualquer profundidade do projeto. Isso significa que os dois documentos citados no README podem não estar de fato no repositório entregue. Deixo esse ponto registrado aqui para correção antes da entrega final, e este relatório eu mantenho deliberadamente fora de qualquer pasta docs, direto na raiz do projeto.

## Setup inicial

Perdi bastante tempo com problemas de ambiente no Windows, nenhum deles relacionado a decisão de arquitetura. O Docker não funcionava porque o WSL2 não estava habilitado corretamente, precisei instalar componentes opcionais do Windows manualmente e reiniciar a máquina mais de uma vez. Depois disso, a porta padrão do Postgres já estava ocupada por uma instalação nativa usada em outros projetos meus, resolvi mapeando o container para outra porta em vez de mexer no serviço existente.

O Prisma que instalei era a versão 7, que mudou bastante coisa em relação ao que a maioria dos tutoriais disponíveis ainda documenta. A configuração de conexão saiu do schema.prisma e foi para um arquivo separado, e passou a exigir um driver adapter explícito para conectar ao banco. Descobri isso na prática, testando.

Também tive problemas de codificação de caractere em alguns arquivos criados via terminal do Windows, acentos apareciam corrompidos. A causa era o BOM que o PowerShell grava por padrão ao salvar arquivo em UTF8. Depois de identificar isso, padronizei a escrita de arquivo por outro caminho que não grava esse marcador. Como consequência prática, boa parte dos textos de erro e log do sistema ficou sem acentuação, não foi escolha de estilo, foi para não correr risco de reincidir nesse problema.

## Conceitos de arquitetura que escolhi aplicar

Defini desde o início que trabalharia com DDD tático, Clean Architecture, modularização por contexto de negócio, desacoplamento entre camadas, idempotência na submissão, eventos de domínio onde fizesse sentido, princípios de SOLID, separação entre comandos e consultas, e alguma forma de resiliência nas integrações externas.

Ao revisar essas escolhas com mais cuidado, ajustei alguns pontos. Decidi não instalar o pacote de CQRS do NestJS, e sim aplicar a separação entre comandos e consultas apenas como organização de pastas, para não acoplar a aplicação a um framework de mensageria que eu não ia usar por completo.

Corrigi também o fluxo de eventos de domínio. A ideia inicial tinha o caso de uso chamando o publicador de eventos de forma mais direta. Ajustei para que o domínio produza os eventos internamente, sem conhecer nada de infraestrutura, e a camada de aplicação é quem lê esses eventos e os publica através de uma porta abstrata, que a infraestrutura implementa por trás.

Optei por idempotência híbrida em vez de um mecanismo genérico com cache e expiração. Uma constraint única no banco cobre a maior parte do problema de duplicidade, e um cabeçalho de idempotência por requisição cobre o restante, sem o custo de montar uma solução de propósito geral para um único ponto de duplicidade real do sistema.

Decidi não implementar circuit breaker completo, apenas planejei retry com timeout, e nem isso cheguei a conectar de fato no código, fica registrado como pendência.

Ao longo de todo o projeto tomei cuidado de nunca confundir publicação de eventos de domínio com Event Sourcing. São conceitos diferentes e usei apenas o primeiro.

## Estratégia de versionamento

Escolhi um fluxo simplificado baseado em branch curta por tarefa, commits no padrão convencional, e integração por squash na branch principal. Descartei um fluxo mais formal de Gitflow completo, com branches de desenvolvimento e release separadas, porque seria cerimônia desnecessária para um projeto individual de curta duração.

## Modelo de dados

Decidi congelar uma cópia dos dados do investimento no momento em que o convite de avaliação é gerado, em vez de sempre consultar o serviço de investimentos ao vivo. Isso mantém a avaliação íntegra mesmo que o dado original mude depois ou que o serviço externo fique indisponível no futuro. Trato isso como aplicação prática de uma camada anticorrupção entre os dois contextos.

Usei tipo decimal para valores monetários, não ponto flutuante, por precisão. Guardei a versão da política de privacidade aceita como texto explícito, não como um simples booleano, para poder reconstruir exatamente o que a pessoa aceitou se a política mudar de versão no futuro.

A auditoria ficou desenhada como tabela desde o início, apenas de escrita, mas nenhum caso de uso chegou a gravar registro nela durante o desenvolvimento. Isso ficou como pendência conhecida.

Optei por um conjunto fixo de critérios de avaliação, em enum, em vez de uma tabela configurável. Decisão de escopo, dado o tempo disponível.

## Autenticação

Foi a parte que mais me exigiu revisão. A premissa que assumi é que este serviço é apenas consumidor de identidade, não emissor. Ele não faz login nem cadastro, só valida um token que, na vida real, seria emitido pela plataforma principal da allu. Isso está alinhado ao próprio cenário descrito no desafio, que fala de um convite enviado a alguém que já é cliente, não de um cadastro novo.

Usei assinatura assimétrica em vez de simétrica, o serviço guarda só a chave pública, nunca a privada, então mesmo comprometido ele não teria como forjar um token válido. Fixei explicitamente o algoritmo de assinatura aceito para evitar um ataque conhecido de troca de algoritmo, e validei emissor e destinatário do token para impedir que um token de outro sistema da allu fosse aceito aqui.

Escolhi Bearer token em vez de cookie de sessão. Isso elimina o vetor clássico de CSRF, porque o token não é enviado automaticamente pelo navegador, e serve melhor a um cenário com múltiplos consumidores possíveis da API além do navegador. A troca que aceitei foi que, se o token vazar, ele pode ser reutilizado até expirar, mitiguei isso mantendo o tempo de vida curto e, no frontend, guardando o token em armazenamento de sessão do navegador em vez de armazenamento permanente.

Separei autorização por papel de autorização por posse do recurso. Quando alguém tenta acessar um recurso que existe mas não é dele, devolvo sempre recurso não encontrado, nunca acesso negado, para não confirmar a um possível atacante que aquele identificador existe.

Depois de uma revisão de segurança, corrigi variáveis de ambiente que sobraram de uma abordagem anterior de assinatura simétrica e não eram mais usadas por nada, conectei bibliotecas de proteção contra abuso de requisição e de cabeçalho de segurança que já estavam instaladas mas nunca tinham sido ligadas, troquei a política de CORS de aceitar qualquer origem para uma lista definida, reduzi o conteúdo do token para não carregar mais dado do que o necessário, e unifiquei em um único lugar a tipagem do usuário autenticado dentro da requisição, que estava duplicada em três arquivos diferentes.

Sobre teste, decidi não escrever teste automatizado cobrindo a verificação criptográfica de assinatura em si, confio nisso à biblioteca que já faz esse trabalho e é testada por quem a mantém. O que testei de forma automatizada foi a lógica própria, o mapeamento do token para o usuário autenticado e o tratamento de falha de autenticação. A verificação criptográfica real eu confirmei manualmente rodando a aplicação e fazendo requisições reais.

Configurei os guards de autenticação e autorização como globais, então qualquer rota nova nasce protegida por padrão, e só fica aberta se eu marcar isso explicitamente. Achei mais seguro esse padrão do que proteger rota por rota e correr o risco de esquecer alguma.

## Domínio da avaliação

Modelei a entidade central com uma máquina de estados explícita, cada transição validada, sem permitir pular etapa. Criei objetos de valor para nota, aceite de política e, mais tarde, anexo.

Percebi durante o desenvolvimento que tinha esquecido o suporte a anexo no planejamento inicial do domínio, apesar de ser um dos cinco requisitos mínimos do desafio. Corrigi isso relendo o próprio enunciado com atenção, e defini um limite de três anexos por avaliação e cinco megabytes por arquivo, valores que escolhi de forma razoável mas arbitrária, e deixo isso registrado como tal.

Em revisões críticas que fiz do meu próprio código, encontrei e corrigi alguns problemas reais. O getter de notas devolvia a referência direta da estrutura interna, permitindo alteração por fora da entidade, enquanto o de anexos já fazia cópia corretamente, corrigi essa assimetria. A validação de aceite de política não rejeitava string vazia, corrigi. A validação de tamanho de anexo aceitava valores não numéricos por causa de uma peculiaridade de comparação da linguagem, corrigi depois de notar que o objeto de valor de nota já tratava isso certo e o de anexo não.

## Casos de uso

O primeiro caso de uso que escrevi foi a submissão de avaliação, que trata idempotência em duas camadas, busca o investimento através de uma porta que representa o contexto externo, monta a entidade, persiste e publica os eventos.

Na fronteira com o contexto de investimentos, optei por traduzir explicitamente o motivo de encerramento vindo de fora para o formato interno do meu domínio, em vez de compartilhar o mesmo tipo entre os dois lados. Cheguei a tentar compartilhar um único tipo primeiro, mas voltei atrás ao perceber que isso quebraria o propósito de manter os dois contextos independentes, se o sistema externo mudar a forma de representar esse dado no futuro, meu domínio não deveria ser afetado sem uma tradução explícita no meio.

Também notei, depois de já ter os casos de uso de moderação prontos, que faltava uma forma de consultar os dados do investimento antes da submissão, já que o próprio enunciado descreve dois passos distintos, primeiro visualizar, depois avaliar. Adicionei uma consulta específica para isso.

Numa revisão encontrei um vazamento real de exceção interna, quando duas requisições diferentes usavam a mesma chave de idempotência, o erro cru do banco escapava para o cliente da API. Corrigi criando um erro de aplicação específico para esse caso, mapeado para o código de conflito HTTP.

## Segurança em nível de linha no banco

Foi o ponto de maior debate comigo mesmo sobre o que cortar dado o tempo disponível. Cheguei a considerar deixar essa parte só documentada como pendência, mas decidi que segurança em nível de linha era requisito, não item cortável, dado que o desafio menciona explicitamente milhares de clientes e padrão de produto financeiro.

Descobri que o usuário padrão do Postgres tem privilégio de superusuário, e superusuário ignora essa camada de proteção independente de qualquer política escrita. Criei um usuário de banco dedicado, sem esse privilégio, e uma variável de conexão separada usada só em tempo de execução, mantendo a conexão administrativa restrita às migrações de schema.

Estendi as políticas também para as tabelas filhas, não só para a tabela principal, porque a integridade referencial por chave estrangeira garante consistência de dado, não autorização de acesso.

Em uma validação técnica que fiz de propósito, encontrei uma falha real, a política original de atualização pelo próprio cliente não restringia por status da avaliação, o que na prática permitiria que um cliente aprovasse a própria avaliação direto no banco, contornando a moderação. Corrigi restringindo essa política aos estados iniciais do ciclo de vida.

Optei por definir a variável de contexto de sessão dentro de uma transação curta por método de repositório, em vez de uma transação única para a requisição inteira. O motivo técnico é que o pool de conexão devolve a conexão física entre requisições, e se eu definisse essa variável fora de uma transação ela vazaria o contexto de um cliente para a próxima requisição que reaproveitasse a mesma conexão.

Também encontrei e corrigi uma condição de corrida real, duas submissões simultâneas para o mesmo investimento podiam passar juntas pela checagem de que ainda não existia avaliação, e uma delas quebrava com erro não tratado ao tentar gravar. Corrigi capturando o erro de restrição única do banco e reaproveitando a mesma lógica de busca por idempotência para devolver o resultado já existente.

A senha do usuário de banco ficou em texto plano dentro da migração, deixo registrado que isso só é aceitável por se tratar de ambiente local descartável, em produção essa credencial viria de um gerenciador de segredo ou de autenticação sem senha fixa.

Encontrei, mas não cheguei a corrigir dentro do tempo que tive, outra condição de corrida, dessa vez entre duas ações de moderação simultâneas sobre a mesma avaliação. Não existe hoje um bloqueio que impeça a segunda ação de sobrescrever silenciosamente a primeira. Fica registrado como risco conhecido para uma próxima iteração.

## Camada de apresentação

Implementei um filtro de exceção global que traduz os erros do domínio e da aplicação para código HTTP apropriado. Os campos de entrada têm validação própria na borda, redundante com a do domínio de propósito, para devolver erro claro antes mesmo de chegar no caso de uso. A validação de arquivo anexado verifica o conteúdo real do arquivo, não apenas a extensão ou o tipo declarado, testei isso renomeando um executável para parecer um pdf e confirmei que era rejeitado mesmo assim.

Decidi não criar um módulo separado para moderação, os casos de uso de aprovar e rejeitar ficam dentro do mesmo módulo de avaliação. Havia uma estrutura de pasta vazia criada no início do projeto sugerindo um módulo separado, mas ao encontrar isso de novo confirmei que era só resíduo de uma etapa anterior, sem nenhuma decisão de design por trás, e descartei.

Durante um teste manual percebi que o motivo de uma rejeição nunca voltava em nenhuma consulta posterior, porque nem a entidade nem a tabela de banco tinham campo para guardar isso, o motivo existia só dentro do evento de domínio, que não tem ninguém ouvindo. Fica registrado como pendência.

Em uma auditoria que fiz do próprio código encontrei uma linha corrompida que impedia a compilação do projeto, e um teste de ponta a ponta que estava quebrado desde o início, sem nenhuma relação com o que eu tinha construído depois, faltava configuração de resolução de caminho de módulo no arquivo de configuração de teste. Corrigi os dois e reescrevi o teste quebrado para validar algo real e estável em vez de uma rota que já não existia mais no projeto.

## Frontend

Construí do zero, sem nenhum ponto de partida. Escolhi o pacote de roteamento mais recente e unificado em vez do pacote tradicional, porque este último está preso numa versão com falha de segurança conhecida sem correção lançada.

Optei por guardar o token de sessão em armazenamento de sessão do navegador, não em armazenamento permanente nem só em memória, como equilíbrio entre sobreviver a um recarregamento de página e não manter o token acessível além do tempo de vida dele.

Tratei o formato exato de como o formulário envia as notas ao backend como uma suposição não confirmada em nenhum lugar do código fonte, isolei isso numa única função e me policiei para confirmar via requisição real contra o backend antes de construir o resto do formulário em cima dessa suposição.

Fixei a versão de política em um valor único e o texto de aceite como genérico com link marcado como provisório, porque não existe endpoint nem conteúdo real de política em nenhuma parte do sistema até agora.

Na reta final, uma sessão de trabalho perdeu o histórico de contexto no meio da execução de um plano de quatro etapas para as telas de negócio. O código já produzido não se perdeu, ficou intacto em disco, só sem registro em controle de versão ainda. Diante do tempo que restava, decidi reduzir o escopo ao mínimo necessário para cobrir os cinco requisitos do desafio numa única tela funcional, a de submissão de avaliação, abrindo mão de teste automatizado, tratamento de erro mais refinado e validação de formulário estruturada nessa etapa final. O painel de moderação, a listagem de avaliações do cliente e a tela de detalhe não ficaram prontos.

## O que ficou de fora, resumido

Não implementei o endpoint público de avaliações aprovadas, porque o enunciado descreve isso como uso futuro possível, não requisito atual. Não conectei retry nem circuit breaker, apesar de ter deixado a biblioteca instalada desde o início. Não configurei integração contínua. Não usei cache nem Redis, porque o único cenário que justificaria isso é justamente o endpoint público que decidi não fazer. Não implementei renovação de sessão nem descoberta dinâmica de chave de assinatura, por decisão de arquitetura, não por falta de tempo. Não populei a tabela de auditoria. Não persisti o motivo de rejeição. Não protegi contra ação de moderação concorrente. Não conectei nenhuma ferramenta externa de observabilidade, o que existe é log estruturado pontual nos componentes de autenticação.

## O que fiz além do exigido

Implementei segurança em nível de linha real no banco, com usuário próprio sem privilégio administrativo e política em todas as tabelas do domínio, mesmo não sendo exigido de forma explícita pelo enunciado. Validei tipo de arquivo pelo conteúdo real, não pela extensão. Implementei idempotência de requisição além da constraint natural do banco. Construí uma tradução explícita na fronteira entre os dois contextos de negócio, em vez de acoplar os tipos diretamente. Mantive defesa em profundidade, com filtro de posse tanto na camada de aplicação quanto na regra de segurança do banco.

## Uma observação sobre o processo

Toda vez que parei para revisar criticamente o que tinha acabado de escrever, em vez de aceitar que build e teste automatizado passando era suficiente, encontrei pelo menos um problema real. Bug de compilação, exceção vazando, condição de corrida, validação faltando, inconsistência de nome. Isso me convenceu de que vale mais revisar de novo com ceticismo do que confiar na primeira passada.
