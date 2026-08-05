-- Role de runtime, sem privilegio de superuser. O usuario `postgres`
-- (usado por DATABASE_URL, dono do schema) sempre ignora RLS, com
-- qualquer policy escrita — sem este role restrito, a migration inteira
-- abaixo seria decorativa.
--
-- A senha deste role esta em texto plano nesta migration por se tratar de
-- ambiente de desenvolvimento local, descartavel a qualquer momento via
-- `docker compose down -v`. Em producao, a criacao deste usuario e o
-- gerenciamento de sua credencial NAO fariam parte do versionamento de
-- schema — a senha viria de um secrets manager (AWS Secrets Manager, Vault,
-- etc.) ou, idealmente, seria substituida por autenticacao IAM sem senha
-- estatica (ex: RDS IAM Authentication). Fora de escopo implementar isso
-- agora — decisao documentada conscientemente, nao um descuido.
DO $$
BEGIN
  CREATE ROLE allu_invest_app LOGIN PASSWORD 'troque-esta-senha-em-producao';
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

GRANT CONNECT ON DATABASE allu_invest TO allu_invest_app;
GRANT USAGE ON SCHEMA public TO allu_invest_app;

-- Sem DELETE em nenhuma tabela: nenhum caso de uso do dominio exclui
-- registro. audit_log_avaliacoes sem UPDATE: e append-only por design,
-- ja documentado em DATA_MODEL.md.
GRANT SELECT, INSERT, UPDATE ON avaliacoes TO allu_invest_app;
GRANT SELECT, INSERT, UPDATE ON notas_criterio TO allu_invest_app;
GRANT SELECT, INSERT, UPDATE ON anexos TO allu_invest_app;
GRANT SELECT, INSERT ON audit_log_avaliacoes TO allu_invest_app;

-- avaliacoes
--
-- Colunas do schema nao sao snake_case (nenhum campo tem @map) — os nomes
-- reais das colunas sao exatamente os do Prisma, camelCase, e por isso
-- precisam de aspas duplas ("clienteId", nao cliente_id).
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY cliente_ve_propria_avaliacao ON avaliacoes
  FOR SELECT
  USING ("clienteId" = current_setting('app.current_cliente_id', true));

CREATE POLICY moderador_ve_tudo ON avaliacoes
  FOR SELECT
  USING (current_setting('app.current_role', true) = 'MODERADOR');

-- Sem esta policy, listarPublicasAprovadas() nunca retornaria nada: as
-- duas policies acima exigem posse ou papel de moderador, e a leitura
-- publica (pagina do produto financeiro, sem cliente autenticado) nao tem
-- nenhum dos dois. "Aprovada" e por definicao conteudo destinado a
-- exibicao publica (cenario de negocio do desafio), entao a policy
-- restringe por status, nao por identidade.
CREATE POLICY publico_ve_aprovadas ON avaliacoes
  FOR SELECT
  USING (status = 'APROVADA');

CREATE POLICY cliente_insere_propria_avaliacao ON avaliacoes
  FOR INSERT
  WITH CHECK (
    "clienteId" = current_setting('app.current_cliente_id', true)
    AND status IN ('RASCUNHO', 'ENVIADA')
  );

CREATE POLICY moderador_atualiza_status ON avaliacoes
  FOR UPDATE
  USING (current_setting('app.current_role', true) = 'MODERADOR')
  WITH CHECK (current_setting('app.current_role', true) = 'MODERADOR');

-- Nenhum caso de uso atual dispara isto (cliente so faz INSERT via
-- submeter-avaliacao; todo UPDATE hoje vem do moderador, via
-- AprovarAvaliacaoHandler/RejeitarAvaliacaoHandler). Mantida como
-- infraestrutura antecipada para um futuro "editar rascunho" pelo cliente
-- — sem custo extra de privilegio, porque o GRANT UPDATE ja e necessario
-- de qualquer forma para o fluxo do moderador. status restrito em
-- USING e WITH CHECK, simetricamente: sem isso, um cliente poderia rodar
-- UPDATE ... SET status = 'APROVADA' na propria linha e se auto-aprovar,
-- porque policies permissivas se combinam com OR entre si.
CREATE POLICY cliente_atualiza_propria_em_rascunho ON avaliacoes
  FOR UPDATE
  USING (
    "clienteId" = current_setting('app.current_cliente_id', true)
    AND status IN ('RASCUNHO', 'ENVIADA')
  )
  WITH CHECK (
    "clienteId" = current_setting('app.current_cliente_id', true)
    AND status IN ('RASCUNHO', 'ENVIADA')
  );

-- notas_criterio / anexos: sem clienteId proprio — FK com cascade garante
-- integridade referencial, nao autorizacao. Posse verificada via EXISTS
-- contra avaliacoes. Escrita (FOR ALL, cobre INSERT/UPDATE/DELETE-embora-
-- deny-by-default-pra-DELETE-por-falta-de-GRANT) fica restrita a dono ou
-- moderador — nunca ao status. Leitura publica das filhas de uma
-- avaliacao aprovada e uma policy FOR SELECT separada, de proposito: uma
-- unica policy combinando os dois por engano deixaria "aprovada" liberar
-- escrita tambem, nao so leitura.
ALTER TABLE notas_criterio ENABLE ROW LEVEL SECURITY;

CREATE POLICY escreve_via_avaliacao_propria ON notas_criterio
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM avaliacoes a WHERE a.id = "avaliacaoId"
      AND (a."clienteId" = current_setting('app.current_cliente_id', true)
           OR current_setting('app.current_role', true) = 'MODERADOR')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM avaliacoes a WHERE a.id = "avaliacaoId"
      AND (a."clienteId" = current_setting('app.current_cliente_id', true)
           OR current_setting('app.current_role', true) = 'MODERADOR')
  ));

CREATE POLICY publico_le_notas_de_aprovadas ON notas_criterio
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM avaliacoes a WHERE a.id = "avaliacaoId" AND a.status = 'APROVADA'
  ));

ALTER TABLE anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY escreve_via_avaliacao_propria ON anexos
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM avaliacoes a WHERE a.id = "avaliacaoId"
      AND (a."clienteId" = current_setting('app.current_cliente_id', true)
           OR current_setting('app.current_role', true) = 'MODERADOR')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM avaliacoes a WHERE a.id = "avaliacaoId"
      AND (a."clienteId" = current_setting('app.current_cliente_id', true)
           OR current_setting('app.current_role', true) = 'MODERADOR')
  ));

CREATE POLICY publico_le_anexos_de_aprovadas ON anexos
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM avaliacoes a WHERE a.id = "avaliacaoId" AND a.status = 'APROVADA'
  ));

-- audit_log_avaliacoes: leitura so moderador; insercao permissiva por ora
-- (nenhum handler dos Modulos 1-3 escreve nela ainda — quando existir,
-- apertar este WITH CHECK para validar o ator/acao de verdade em vez de
-- aceitar qualquer insercao).
ALTER TABLE audit_log_avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY moderador_le_auditoria ON audit_log_avaliacoes
  FOR SELECT
  USING (current_setting('app.current_role', true) = 'MODERADOR');

CREATE POLICY sistema_insere_auditoria ON audit_log_avaliacoes
  FOR INSERT
  WITH CHECK (true);

-- Sem policy de DELETE em nenhuma tabela -> deny-by-default (correto: este
-- dominio nunca exclui registro).
