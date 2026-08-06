import { criarRepositoryMock } from '../../__test-utils__/ports.mock';
import { ListarPendentesModeracaoHandler } from './listar-pendentes-moderacao.handler';
import { ListarPendentesModeracaoQuery } from './listar-pendentes-moderacao.query';

describe('ListarPendentesModeracaoHandler', () => {
  it('repassa paginacao ao repositorio sem texto de busca quando nao informado', async () => {
    const repository = criarRepositoryMock();
    repository.listarPendentesDeModeracao.mockResolvedValue({
      itens: [],
      total: 0,
    });

    const handler = new ListarPendentesModeracaoHandler(repository);
    await handler.executar(new ListarPendentesModeracaoQuery(1, 10));

    expect(repository.listarPendentesDeModeracao).toHaveBeenCalledWith(
      { pagina: 1, tamanhoPagina: 10 },
      { q: undefined },
    );
  });

  it('repassa o texto de busca ao repositorio quando informado', async () => {
    const repository = criarRepositoryMock();
    repository.listarPendentesDeModeracao.mockResolvedValue({
      itens: [],
      total: 0,
    });

    const handler = new ListarPendentesModeracaoHandler(repository);
    await handler.executar(
      new ListarPendentesModeracaoQuery(1, 10, 'cliente-teste-001'),
    );

    expect(repository.listarPendentesDeModeracao).toHaveBeenCalledWith(
      { pagina: 1, tamanhoPagina: 10 },
      { q: 'cliente-teste-001' },
    );
  });
});
