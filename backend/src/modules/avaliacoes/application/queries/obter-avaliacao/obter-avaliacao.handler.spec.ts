import {
  Avaliacao,
  MotivoEncerramento,
} from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import {
  AuthenticatedUser,
  RoleUsuario,
} from '@shared/domain/auth/authenticated-user';
import { AvaliacaoNaoEncontradaError } from '../../errors/orquestracao.errors';
import { ObterAvaliacaoHandler } from './obter-avaliacao.handler';
import { ObterAvaliacaoQuery } from './obter-avaliacao.query';
import { criarRepositoryMock } from '../../__test-utils__/ports.mock';

function criarAvaliacaoDeTeste(clienteId: string): Avaliacao {
  return Avaliacao.criarConvite({
    id: 'avaliacao-1',
    investimentoId: 'investimento-1',
    clienteId,
    snapshotInvestimento: {
      tipoProduto: 'CDB',
      valorAplicado: 1000,
      dataAplicacao: new Date('2025-01-01'),
      dataEncerramento: new Date('2026-01-01'),
      motivoEncerramento: MotivoEncerramento.VENCIMENTO,
    },
  });
}

function criarUsuario(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: 'cliente-1',
    role: RoleUsuario.CLIENTE,
    email: 'usuario@teste.com',
    ...overrides,
  };
}

describe('ObterAvaliacaoHandler', () => {
  it('retorna a avaliacao quando o solicitante e o dono (CLIENTE)', async () => {
    const repository = criarRepositoryMock();
    const avaliacao = criarAvaliacaoDeTeste('cliente-1');
    repository.buscarPorId.mockResolvedValue(avaliacao);

    const handler = new ObterAvaliacaoHandler(repository);
    const dono = criarUsuario({ id: 'cliente-1', role: RoleUsuario.CLIENTE });

    const resultado = await handler.executar(
      new ObterAvaliacaoQuery('avaliacao-1', dono),
    );

    expect(resultado).toBe(avaliacao);
  });

  it('retorna a avaliacao quando o solicitante e MODERADOR, mesmo nao sendo o dono', async () => {
    const repository = criarRepositoryMock();
    const avaliacao = criarAvaliacaoDeTeste('cliente-1');
    repository.buscarPorId.mockResolvedValue(avaliacao);

    const handler = new ObterAvaliacaoHandler(repository);
    const moderador = criarUsuario({
      id: 'moderador-1',
      role: RoleUsuario.MODERADOR,
    });

    const resultado = await handler.executar(
      new ObterAvaliacaoQuery('avaliacao-1', moderador),
    );

    expect(resultado).toBe(avaliacao);
  });

  it('lanca o mesmo AvaliacaoNaoEncontradaError tanto para avaliacao inexistente quanto para avaliacao de outro cliente', async () => {
    const repositorySemAvaliacao = criarRepositoryMock();
    repositorySemAvaliacao.buscarPorId.mockResolvedValue(null);
    const handlerSemAvaliacao = new ObterAvaliacaoHandler(
      repositorySemAvaliacao,
    );

    const repositoryComAvaliacaoDeOutroCliente = criarRepositoryMock();
    repositoryComAvaliacaoDeOutroCliente.buscarPorId.mockResolvedValue(
      criarAvaliacaoDeTeste('cliente-dono'),
    );
    const handlerComAvaliacaoDeOutroCliente = new ObterAvaliacaoHandler(
      repositoryComAvaliacaoDeOutroCliente,
    );

    const terceiro = criarUsuario({
      id: 'cliente-terceiro',
      role: RoleUsuario.CLIENTE,
    });

    // Os dois caminhos ("nao existe" e "existe mas nao e sua") precisam
    // convergir pro mesmo tipo de erro — e' isso que garante que o
    // controller (Modulo 4) sempre responda 404, nunca 403, sem vazar pra
    // um atacante se aquele ID de avaliacao existe ou nao.
    await expect(
      handlerSemAvaliacao.executar(
        new ObterAvaliacaoQuery('avaliacao-inexistente', terceiro),
      ),
    ).rejects.toBeInstanceOf(AvaliacaoNaoEncontradaError);

    await expect(
      handlerComAvaliacaoDeOutroCliente.executar(
        new ObterAvaliacaoQuery('avaliacao-1', terceiro),
      ),
    ).rejects.toBeInstanceOf(AvaliacaoNaoEncontradaError);
  });
});
