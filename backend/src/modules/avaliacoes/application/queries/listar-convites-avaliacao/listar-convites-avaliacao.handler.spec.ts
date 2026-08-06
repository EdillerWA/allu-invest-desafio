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

describe('ListarConvitesAvaliacaoHandler', () => {
  it('retorna investimentoId sem avaliacao com avaliacaoId e status nulos', async () => {
    const investimentoGateway = criarInvestimentoGatewayMock();
    const repository = criarRepositoryMock();
    investimentoGateway.listarEncerradosPorCliente.mockResolvedValue([
      {
        investimentoId: 'investimento-001',
        clienteId: 'cliente-1',
        tipoProduto: 'CDB',
        valorAplicado: 1000,
        dataAplicacao: new Date('2025-01-01'),
        dataEncerramento: new Date('2026-01-01'),
        motivoEncerramento: 'VENCIMENTO',
      },
    ]);
    repository.buscarPorInvestimentoId.mockResolvedValue(null);

    const handler = new ListarConvitesAvaliacaoHandler(
      investimentoGateway,
      repository,
    );
    const resultado = await handler.executar(
      new ListarConvitesAvaliacaoQuery('cliente-1'),
    );

    expect(resultado).toEqual([
      expect.objectContaining({
        investimentoId: 'investimento-001',
        avaliacaoId: null,
        statusAvaliacao: null,
      }),
    ]);
  });

  it('retorna avaliacaoId e status quando ja existe avaliacao para o investimento', async () => {
    const investimentoGateway = criarInvestimentoGatewayMock();
    const repository = criarRepositoryMock();
    investimentoGateway.listarEncerradosPorCliente.mockResolvedValue([
      {
        investimentoId: 'investimento-001',
        clienteId: 'cliente-1',
        tipoProduto: 'CDB',
        valorAplicado: 1000,
        dataAplicacao: new Date('2025-01-01'),
        dataEncerramento: new Date('2026-01-01'),
        motivoEncerramento: 'VENCIMENTO',
      },
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

    expect(resultado[0].avaliacaoId).toBe('avaliacao-1');
    expect(resultado[0].statusAvaliacao).toBe(StatusAvaliacao.ENVIADA);
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

    expect(resultado).toEqual([]);
    expect(repository.buscarPorInvestimentoId).not.toHaveBeenCalled();
  });
});
