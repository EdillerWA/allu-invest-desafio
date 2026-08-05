import { Avaliacao } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { DomainEvent } from '@shared/domain/domain-event';
import { InvestimentoEncerrado } from '@modules/investimentos/application/ports/investimento-gateway.port';
import {
  ArquivoParaSalvar,
  ArquivoSalvo,
} from '@modules/avaliacoes/application/ports/arquivo-storage.port';

type Paginacao = { pagina: number; tamanhoPagina: number };
type ResultadoPaginado = { itens: Avaliacao[]; total: number };

// Mocks tipados via propriedade (jest.fn<Retorno, Args>()), nao via
// jest.Mocked<PortaAbstrata>: derivar o tipo do mock direto da classe
// abstrata da porta preserva sintaxe de metodo, que o
// @typescript-eslint/unbound-method entende como "pode perder o this" ao
// ser passado pra expect(). Aqui nao existe metodo nenhum, so propriedades
// funcao — a checagem nao se aplica, e nao precisa de nenhum disable.
//
// Generic de 2 parametros (Retorno, Args), nao o de 1 parametro
// (fn: (...) => Retorno): fora de arquivo *.spec.ts, quem type-checa e o
// tsc puro do `nest build` (tsconfig.build.json exclui **/*spec.ts, entao
// esse mock nunca tinha sido compilado por ele ate virar arquivo
// compartilhado) — e o overload de 1 parametro nao existe nessa resolucao,
// so o de 0 ou 2. O de 2 parametros funciona nos dois compiladores
// (tsc do build e ts-jest do `pnpm test`).
export function criarRepositoryMock() {
  return {
    salvar: jest.fn<Promise<void>, [Avaliacao]>(),
    buscarPorId: jest.fn<Promise<Avaliacao | null>, [string]>(),
    buscarPorInvestimentoId: jest.fn<Promise<Avaliacao | null>, [string]>(),
    buscarPorIdempotencyKey: jest.fn<Promise<Avaliacao | null>, [string]>(),
    listarPorCliente: jest.fn<
      Promise<ResultadoPaginado>,
      [string, Paginacao]
    >(),
    listarPendentesDeModeracao: jest.fn<
      Promise<ResultadoPaginado>,
      [Paginacao]
    >(),
    listarPublicasAprovadas: jest.fn<
      Promise<ResultadoPaginado>,
      [string, Paginacao]
    >(),
  };
}

export function criarEventPublisherMock() {
  return {
    publicar: jest.fn<void, [DomainEvent]>(),
  };
}

export function criarInvestimentoGatewayMock() {
  return {
    buscarInvestimentoEncerrado: jest.fn<
      Promise<InvestimentoEncerrado | null>,
      [string]
    >(),
  };
}

export function criarArquivoStorageMock() {
  return {
    salvar: jest.fn<Promise<ArquivoSalvo>, [ArquivoParaSalvar]>(),
  };
}
