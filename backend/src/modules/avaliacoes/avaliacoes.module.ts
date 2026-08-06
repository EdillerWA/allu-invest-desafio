import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { RequestContextModule } from '@shared/infrastructure/request-context/request-context.module';
import { AvaliacaoRepositoryPort } from './application/ports/avaliacao-repository.port';
import { EventPublisherPort } from './application/ports/event-publisher.port';
import { ArquivoStoragePort } from './application/ports/arquivo-storage.port';
import { InvestimentoGatewayPort } from '@modules/investimentos/application/ports/investimento-gateway.port';
import { PrismaAvaliacaoRepository } from './infrastructure/persistence/prisma-avaliacao.repository';
import { NestEventPublisher } from './infrastructure/events/nest-event-publisher';
import { LocalFileStorageAdapter } from './infrastructure/storage/local-file-storage.adapter';
import { MockInvestimentoGatewayAdapter } from '@modules/investimentos/infrastructure/mock-investimento-gateway.adapter';
import { SubmeterAvaliacaoHandler } from './application/commands/submeter-avaliacao/submeter-avaliacao.handler';
import { AprovarAvaliacaoHandler } from './application/commands/aprovar-avaliacao/aprovar-avaliacao.handler';
import { RejeitarAvaliacaoHandler } from './application/commands/rejeitar-avaliacao/rejeitar-avaliacao.handler';
import { ObterAvaliacaoHandler } from './application/queries/obter-avaliacao/obter-avaliacao.handler';
import { ListarMinhasAvaliacoesHandler } from './application/queries/listar-minhas-avaliacoes/listar-minhas-avaliacoes.handler';
import { ListarPendentesModeracaoHandler } from './application/queries/listar-pendentes-moderacao/listar-pendentes-moderacao.handler';
import { ListarAvaliacoesPublicasHandler } from './application/queries/listar-avaliacoes-publicas/listar-avaliacoes-publicas.handler';
import { ObterInvestimentoParaAvaliacaoHandler } from './application/queries/obter-investimento-para-avaliacao/obter-investimento-para-avaliacao.handler';
import { ListarConvitesAvaliacaoHandler } from './application/queries/listar-convites-avaliacao/listar-convites-avaliacao.handler';
import { ObterAnexoParaDownloadHandler } from './application/queries/obter-anexo-para-download/obter-anexo-para-download.handler';
import { AvaliacoesController } from './presentation/controllers/avaliacoes.controller';
import { ModeracaoController } from './presentation/controllers/moderacao.controller';

@Module({
  imports: [PrismaModule, RequestContextModule],
  controllers: [AvaliacoesController, ModeracaoController],
  providers: [
    { provide: AvaliacaoRepositoryPort, useClass: PrismaAvaliacaoRepository },
    { provide: EventPublisherPort, useClass: NestEventPublisher },
    { provide: ArquivoStoragePort, useClass: LocalFileStorageAdapter },
    {
      provide: InvestimentoGatewayPort,
      useClass: MockInvestimentoGatewayAdapter,
    },
    SubmeterAvaliacaoHandler,
    AprovarAvaliacaoHandler,
    RejeitarAvaliacaoHandler,
    ObterAvaliacaoHandler,
    ListarMinhasAvaliacoesHandler,
    ListarPendentesModeracaoHandler,
    ListarAvaliacoesPublicasHandler,
    ObterInvestimentoParaAvaliacaoHandler,
    ListarConvitesAvaliacaoHandler,
    ObterAnexoParaDownloadHandler,
  ],
})
export class AvaliacoesModule {}
