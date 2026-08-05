-- CreateEnum
CREATE TYPE "StatusAvaliacao" AS ENUM ('RASCUNHO', 'ENVIADA', 'EM_MODERACAO', 'APROVADA', 'REJEITADA');

-- CreateEnum
CREATE TYPE "RoleUsuario" AS ENUM ('CLIENTE', 'MODERADOR');

-- CreateEnum
CREATE TYPE "TipoCriterio" AS ENUM ('ATENDIMENTO', 'CLAREZA_INFORMACOES', 'FACILIDADE_RESGATE', 'RENTABILIDADE_PERCEBIDA', 'RECOMENDARIA_A_OUTROS');

-- CreateEnum
CREATE TYPE "MotivoEncerramento" AS ENUM ('VENCIMENTO', 'RESGATE_ANTECIPADO', 'OUTRO');

-- CreateEnum
CREATE TYPE "AcaoAuditoria" AS ENUM ('CONVITE_GERADO', 'AVALIACAO_SUBMETIDA', 'ENVIADA_PARA_MODERACAO', 'APROVADA', 'REJEITADA', 'ANEXO_ADICIONADO');

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "investimentoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "investimentoTipoProduto" TEXT NOT NULL,
    "investimentoValorAplicado" DECIMAL(18,2) NOT NULL,
    "investimentoDataAplicacao" TIMESTAMP(3) NOT NULL,
    "investimentoDataEncerramento" TIMESTAMP(3) NOT NULL,
    "investimentoMotivoEncerramento" "MotivoEncerramento" NOT NULL,
    "status" "StatusAvaliacao" NOT NULL DEFAULT 'RASCUNHO',
    "comentario" TEXT,
    "politicaVersaoAceita" TEXT NOT NULL,
    "politicaAceitaEm" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_criterio" (
    "id" TEXT NOT NULL,
    "avaliacaoId" TEXT NOT NULL,
    "criterio" "TipoCriterio" NOT NULL,
    "nota" INTEGER NOT NULL,

    CONSTRAINT "notas_criterio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexos" (
    "id" TEXT NOT NULL,
    "avaliacaoId" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "caminhoArmazenamento" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log_avaliacoes" (
    "id" TEXT NOT NULL,
    "avaliacaoId" TEXT NOT NULL,
    "acao" "AcaoAuditoria" NOT NULL,
    "atorId" TEXT,
    "atorRole" "RoleUsuario",
    "motivo" TEXT,
    "metadata" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_investimentoId_key" ON "avaliacoes"("investimentoId");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_idempotencyKey_key" ON "avaliacoes"("idempotencyKey");

-- CreateIndex
CREATE INDEX "avaliacoes_clienteId_idx" ON "avaliacoes"("clienteId");

-- CreateIndex
CREATE INDEX "avaliacoes_status_idx" ON "avaliacoes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "notas_criterio_avaliacaoId_criterio_key" ON "notas_criterio"("avaliacaoId", "criterio");

-- CreateIndex
CREATE INDEX "audit_log_avaliacoes_avaliacaoId_idx" ON "audit_log_avaliacoes"("avaliacaoId");

-- AddForeignKey
ALTER TABLE "notas_criterio" ADD CONSTRAINT "notas_criterio_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "avaliacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "avaliacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log_avaliacoes" ADD CONSTRAINT "audit_log_avaliacoes_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "avaliacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
