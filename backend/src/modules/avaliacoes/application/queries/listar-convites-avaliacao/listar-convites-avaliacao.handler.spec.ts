import {
  Avaliacao,
  MotivoEncerramento,
  StatusAvaliacao,
  TipoCriterio,
} from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import {
  criarInvestimentoGatewayMock,
  criarRepositoryMock,
} from '../../__test-utils__/ports.mock';
import { ListarConvitesAvaliacaoHandler } from './listar-convites-avaliacao.handler';
import { ListarConvitesAvaliacaoQuery } from './listar-convites-avaliacao.query';

function criarAvaliacaoEnviada(id: string): Avaliacao {
  const avaliacao = Avaliacao.criarConvite({
    id,
    investimentoId: 'investimento-001',
    clienteId: 'cliente-1',
    snapshotInvestimento: {
      tipoProduto: 'CDB',
      valorAplicado: 1000,
      dataAplicacao: new Date('2025-01-01'),
      dataEncerramento: new Date('2026-01-01'),
      motivoEncerramento: MotivoEncerramento.VENCIMENTO,
    },
  });
  avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 5);
  avaliacao.aceitarPolitica('1.0');
  avaliacao.submeter();
  avaliacao.liberarEventos();
  return avaliacao;
}

function criarInvestimentoFixture(
  investimentoId: string,
  tipoProduto: string,
  valorAplicado: number,
) {
  return {
    investimentoId,
    clienteId: 'cliente-1',
    tipoProduto,
    valorAplicado,
    dataAplicacao: new Date('2025-01-01'),
    dataEncerramento: new Date('2026-01-01'),
    motivoEncerramento: 'VENCIMENTO',
  };
}

describe('ListarConvitesAvaliacaoHandler', () => {
  it('retorna investimentoId sem avaliacao com avaliacaoId e status nulos', async () => {
    const investimentoGateway = criarInvestimentoGatewayMock();
    const repository = criarRepositoryMock();
    investimentoGateway.listarEncerradosPorCliente.mockResolvedValue([
      criarInvestimentoFixture('investimento-001', 'CDB', 1000),
    ]);
    repository.buscarPorInvestimentoId.mockResolvedValue(null);

    const handler = new ListarConvitesAvaliacaoHandler(
      investimentoGateway,
      repository,
    );
    const resultado = await handler.executar(
      new ListarConvitesAvaliacaoQuery('cliente-1'),
    );

    expect(resultado.itens).toEqual([
      expect.objectContaining({
        investimentoId: 'investimento-001',
        avaliacaoId: null,
        statusAvaliacao: null,
      }),
    ]);
    expect(resultado.total).toBe(1);
    expect(resultado.resumo).toEqual({
      totalInvestimentos: 1,
      aguardandoAvaliacao: 1,
      valorTotalAplicado: 1000,
    });
  });

  it('retorna avaliacaoId e status quando ja existe avaliacao para o investimento', async () => {
    const investimentoGateway = criarInvestimentoGatewayMock();
    const repository = criarRepositoryMock();
    investimentoGateway.listarEncerradosPorCliente.mockResolvedValue([
      criarInvestimentoFixture('investimento-001', 'CDB', 1000),
    ]);
    const avaliacao = criarAvaliacaoEnviada('avaliacao-1');
    repository.buscarPorInvestimentoId.mockResolvedValue(avaliacao);

    const handler = new ListarConvitesAvaliacaoHandler(
      investimentoGateway,
      repository,
    );
    const resultado = await handler.executar(
      new ListarConvitesAvaliacaoQuery('cliente-1'),
    );

    expect(resultado.itens[0].avaliacaoId).toBe('avaliacao-1');
    expect(resultado.itens[0].statusAvaliacao).toBe(StatusAvaliacao.ENVIADA);
    expect(resultado.resumo.aguardandoAvaliacao).toBe(0);
  });

  it('retorna lista vazia quando o cliente nao tem investimentos encerrados', async () => {
    const investimentoGateway = criarInvestimentoGatewayMock();
    const repository = criarRepositoryMock();
    investimentoGateway.listarEncerradosPorCliente.mockResolvedValue([]);

    const handler = new ListarConvitesAvaliacaoHandler(
      investimentoGateway,
      repository,
    );
    const resultado = await handler.executar(
      new ListarConvitesAvaliacaoQuery('cliente-1'),
    );

    expect(resultado.itens).toEqual([]);
    expect(resultado.total).toBe(0);
    expect(repository.buscarPorInvestimentoId).not.toHaveBeenCalled();
  });

  it('pagina os resultados, mas o resumo continua contando o conjunto inteiro', async () => {
    const investimentoGateway = criarInvestimentoGatewayMock();
    const repository = criarRepositoryMock();
    investimentoGateway.listarEncerradosPorCliente.mockResolvedValue([
      criarInvestimentoFixture('investimento-001', 'CDB', 1000),
      criarInvestimentoFixture('investimento-002', 'LCI', 2000),
      criarInvestimentoFixture('investimento-003', 'LCA', 3000),
    ]);
    repository.buscarPorInvestimentoId.mockResolvedValue(null);

    const handler = new ListarConvitesAvaliacaoHandler(
      investimentoGateway,
      repository,
    );
    const resultado = await handler.executar(
      new ListarConvitesAvaliacaoQuery('cliente-1', 2, 2),
    );

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0].investimentoId).toBe('investimento-003');
    expect(resultado.total).toBe(3);
    expect(resultado.resumo.totalInvestimentos).toBe(3);
    expect(resultado.resumo.valorTotalAplicado).toBe(6000);
  });

  it('filtra por status AGUARDANDO (sem avaliacao ainda)', async () => {
    const investimentoGateway = criarInvestimentoGatewayMock();
    const repository = criarRepositoryMock();
    investimentoGateway.listarEncerradosPorCliente.mockResolvedValue([
      criarInvestimentoFixture('investimento-001', 'CDB', 1000),
      criarInvestimentoFixture('investimento-002', 'LCI', 2000),
    ]);
    repository.buscarPorInvestimentoId.mockImplementation(
      (investimentoId: string) =>
        Promise.resolve(
          investimentoId === 'investimento-001'
            ? criarAvaliacaoEnviada('avaliacao-1')
            : null,
        ),
    );

    const handler = new ListarConvitesAvaliacaoHandler(
      investimentoGateway,
      repository,
    );
    const resultado = await handler.executar(
      new ListarConvitesAvaliacaoQuery('cliente-1', 1, 10, 'AGUARDANDO'),
    );

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0].investimentoId).toBe('investimento-002');
    expect(resultado.total).toBe(1);
    // Resumo continua sobre os 2 investimentos, nao so o filtrado.
    expect(resultado.resumo.totalInvestimentos).toBe(2);
  });

  it('filtra por texto de busca no tipo de produto', async () => {
    const investimentoGateway = criarInvestimentoGatewayMock();
    const repository = criarRepositoryMock();
    investimentoGateway.listarEncerradosPorCliente.mockResolvedValue([
      criarInvestimentoFixture('investimento-001', 'CDB Prefixado', 1000),
      criarInvestimentoFixture('investimento-002', 'LCI', 2000),
    ]);
    repository.buscarPorInvestimentoId.mockResolvedValue(null);

    const handler = new ListarConvitesAvaliacaoHandler(
      investimentoGateway,
      repository,
    );
    const resultado = await handler.executar(
      new ListarConvitesAvaliacaoQuery('cliente-1', 1, 10, undefined, 'cdb'),
    );

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0].investimentoId).toBe('investimento-001');
  });
});
