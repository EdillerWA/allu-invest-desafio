import { StatusAvaliacao } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { criarRepositoryMock } from '../../__test-utils__/ports.mock';
import { ListarMinhasAvaliacoesHandler } from './listar-minhas-avaliacoes.handler';
import { ListarMinhasAvaliacoesQuery } from './listar-minhas-avaliacoes.query';

describe('ListarMinhasAvaliacoesHandler', () => {
  it('repassa clienteId e paginacao ao repositorio, sem filtro de status quando nao informado', async () => {
    const repository = criarRepositoryMock();
    repository.listarPorCliente.mockResolvedValue({ itens: [], total: 0 });

    const handler = new ListarMinhasAvaliacoesHandler(repository);
    await handler.executar(new ListarMinhasAvaliacoesQuery('cliente-1', 2, 10));

    expect(repository.listarPorCliente).toHaveBeenCalledWith(
      'cliente-1',
      { pagina: 2, tamanhoPagina: 10 },
      { status: undefined, q: undefined },
    );
  });

  it('repassa o status filtrado ao repositorio quando informado', async () => {
    const repository = criarRepositoryMock();
    repository.listarPorCliente.mockResolvedValue({ itens: [], total: 0 });

    const handler = new ListarMinhasAvaliacoesHandler(repository);
    await handler.executar(
      new ListarMinhasAvaliacoesQuery(
        'cliente-1',
        1,
        10,
        StatusAvaliacao.APROVADA,
      ),
    );

    expect(repository.listarPorCliente).toHaveBeenCalledWith(
      'cliente-1',
      { pagina: 1, tamanhoPagina: 10 },
      { status: StatusAvaliacao.APROVADA, q: undefined },
    );
  });

  it('repassa o texto de busca ao repositorio quando informado', async () => {
    const repository = criarRepositoryMock();
    repository.listarPorCliente.mockResolvedValue({ itens: [], total: 0 });

    const handler = new ListarMinhasAvaliacoesHandler(repository);
    await handler.executar(
      new ListarMinhasAvaliacoesQuery('cliente-1', 1, 10, undefined, 'CDB'),
    );

    expect(repository.listarPorCliente).toHaveBeenCalledWith(
      'cliente-1',
      { pagina: 1, tamanhoPagina: 10 },
      { status: undefined, q: 'CDB' },
    );
  });
});
