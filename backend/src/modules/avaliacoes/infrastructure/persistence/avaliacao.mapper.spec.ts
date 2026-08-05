import {
  Avaliacao,
  MotivoEncerramento,
  StatusAvaliacao,
  TipoCriterio,
} from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { Anexo } from '@modules/avaliacoes/domain/value-objects/anexo.vo';
import {
  AvaliacaoPersistida,
  paraDominio,
  paraPersistenciaCreate,
  paraPersistenciaUpdate,
} from './avaliacao.mapper';

// Datas propositalmente diferentes uma da outra: um mapper que trocasse
// investimentoDataAplicacao por investimentoDataEncerramento (ou vice
// versa) passaria despercebido se as duas fossem iguais.
const DATA_APLICACAO = new Date('2024-03-10T00:00:00.000Z');
const DATA_ENCERRAMENTO = new Date('2026-01-05T00:00:00.000Z');

function criarRegistroPersistido(
  overrides: Partial<AvaliacaoPersistida> = {},
): AvaliacaoPersistida {
  return {
    id: 'avaliacao-1',
    investimentoId: 'investimento-1',
    clienteId: 'cliente-1',
    investimentoTipoProduto: 'CDB',
    investimentoValorAplicado: 1234.56,
    investimentoDataAplicacao: DATA_APLICACAO,
    investimentoDataEncerramento: DATA_ENCERRAMENTO,
    investimentoMotivoEncerramento: MotivoEncerramento.RESGATE_ANTECIPADO,
    status: StatusAvaliacao.ENVIADA,
    comentario: 'Otima experiencia',
    politicaVersaoAceita: 'v2.1',
    politicaAceitaEm: new Date('2026-01-06T00:00:00.000Z'),
    idempotencyKey: 'chave-123',
    notas: [
      { criterio: TipoCriterio.ATENDIMENTO, nota: 5 },
      { criterio: TipoCriterio.CLAREZA_INFORMACOES, nota: 4 },
    ],
    anexos: [
      {
        nomeOriginal: 'comprovante.pdf',
        caminhoArmazenamento: '/anexos/comprovante.pdf',
        tipoMime: 'application/pdf',
        tamanhoBytes: 2048,
      },
    ],
    ...overrides,
  };
}

describe('avaliacao.mapper', () => {
  describe('paraDominio', () => {
    it('traduz cada campo do registro persistido para o aggregate, sem trocar nenhum', () => {
      const registro = criarRegistroPersistido();

      const avaliacao = paraDominio(registro);

      expect(avaliacao.id).toBe('avaliacao-1');
      expect(avaliacao.investimentoId).toBe('investimento-1');
      expect(avaliacao.clienteId).toBe('cliente-1');
      expect(avaliacao.status).toBe(StatusAvaliacao.ENVIADA);
      expect(avaliacao.comentario).toBe('Otima experiencia');
      expect(avaliacao.idempotencyKey).toBe('chave-123');

      expect(avaliacao.snapshotInvestimento.tipoProduto).toBe('CDB');
      expect(avaliacao.snapshotInvestimento.valorAplicado).toBe(1234.56);
      expect(avaliacao.snapshotInvestimento.dataAplicacao).toEqual(
        DATA_APLICACAO,
      );
      expect(avaliacao.snapshotInvestimento.dataEncerramento).toEqual(
        DATA_ENCERRAMENTO,
      );
      expect(avaliacao.snapshotInvestimento.motivoEncerramento).toBe(
        MotivoEncerramento.RESGATE_ANTECIPADO,
      );

      expect(avaliacao.notas.size).toBe(2);
      expect(avaliacao.notas.get(TipoCriterio.ATENDIMENTO)?.obterValor()).toBe(
        5,
      );
      expect(
        avaliacao.notas.get(TipoCriterio.CLAREZA_INFORMACOES)?.obterValor(),
      ).toBe(4);

      expect(avaliacao.anexos).toHaveLength(1);
      expect(avaliacao.anexos[0].obterNomeOriginal()).toBe('comprovante.pdf');
      expect(avaliacao.anexos[0].obterTamanhoBytes()).toBe(2048);

      expect(avaliacao.aceitePolitica?.obterVersao()).toBe('v2.1');
      expect(avaliacao.aceitePolitica?.obterDataAceite()).toEqual(
        new Date('2026-01-06T00:00:00.000Z'),
      );
    });

    it('lanca erro quando politicaAceitaEm e nulo (invariante de dominio violada)', () => {
      const registro = criarRegistroPersistido({ politicaAceitaEm: null });

      expect(() => paraDominio(registro)).toThrow();
    });
  });

  describe('paraPersistenciaCreate', () => {
    function criarAvaliacaoDeDominio(): Avaliacao {
      const avaliacao = Avaliacao.criarConvite({
        id: 'avaliacao-1',
        investimentoId: 'investimento-1',
        clienteId: 'cliente-1',
        snapshotInvestimento: {
          tipoProduto: 'CDB',
          valorAplicado: 1234.56,
          dataAplicacao: DATA_APLICACAO,
          dataEncerramento: DATA_ENCERRAMENTO,
          motivoEncerramento: MotivoEncerramento.RESGATE_ANTECIPADO,
        },
      });
      avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 5);
      avaliacao.adicionarAnexo(
        Anexo.criar({
          nomeOriginal: 'comprovante.pdf',
          caminhoArmazenamento: '/anexos/comprovante.pdf',
          tipoMime: 'application/pdf',
          tamanhoBytes: 2048,
        }),
      );
      avaliacao.definirComentario('Otima experiencia');
      avaliacao.aceitarPolitica('v2.1');
      avaliacao.submeter();
      return avaliacao;
    }

    it('traduz o aggregate para o formato de criacao, incluindo nested create de notas e anexos', () => {
      const avaliacao = criarAvaliacaoDeDominio();

      const dados = paraPersistenciaCreate(avaliacao);

      expect(dados.id).toBe('avaliacao-1');
      expect(dados.investimentoTipoProduto).toBe('CDB');
      expect(dados.investimentoDataAplicacao).toEqual(DATA_APLICACAO);
      expect(dados.investimentoDataEncerramento).toEqual(DATA_ENCERRAMENTO);
      expect(dados.status).toBe(StatusAvaliacao.ENVIADA);
      expect(dados.politicaVersaoAceita).toBe('v2.1');
      expect(dados.notas.create).toEqual([
        { criterio: TipoCriterio.ATENDIMENTO, nota: 5 },
      ]);
      expect(dados.anexos.create).toEqual([
        {
          nomeOriginal: 'comprovante.pdf',
          caminhoArmazenamento: '/anexos/comprovante.pdf',
          tipoMime: 'application/pdf',
          tamanhoBytes: 2048,
        },
      ]);
    });

    it('lanca erro quando a avaliacao nao tem aceite de politica', () => {
      const avaliacao = Avaliacao.criarConvite({
        id: 'avaliacao-2',
        investimentoId: 'investimento-2',
        clienteId: 'cliente-1',
        snapshotInvestimento: {
          tipoProduto: 'CDB',
          valorAplicado: 100,
          dataAplicacao: DATA_APLICACAO,
          dataEncerramento: DATA_ENCERRAMENTO,
          motivoEncerramento: MotivoEncerramento.VENCIMENTO,
        },
      });

      expect(() => paraPersistenciaCreate(avaliacao)).toThrow();
    });
  });

  describe('paraPersistenciaUpdate', () => {
    it('so inclui o status, nada de notas/anexos/comentario', () => {
      const avaliacao = Avaliacao.criarConvite({
        id: 'avaliacao-1',
        investimentoId: 'investimento-1',
        clienteId: 'cliente-1',
        snapshotInvestimento: {
          tipoProduto: 'CDB',
          valorAplicado: 100,
          dataAplicacao: DATA_APLICACAO,
          dataEncerramento: DATA_ENCERRAMENTO,
          motivoEncerramento: MotivoEncerramento.VENCIMENTO,
        },
      });

      const dados = paraPersistenciaUpdate(avaliacao);

      expect(dados).toEqual({ status: StatusAvaliacao.RASCUNHO });
    });
  });

  describe('caminho de ida e volta (create -> dominio)', () => {
    it('reconstroi um aggregate equivalente ao original a partir do que seria persistido', () => {
      const original = Avaliacao.criarConvite({
        id: 'avaliacao-1',
        investimentoId: 'investimento-1',
        clienteId: 'cliente-1',
        snapshotInvestimento: {
          tipoProduto: 'CDB',
          valorAplicado: 1234.56,
          dataAplicacao: DATA_APLICACAO,
          dataEncerramento: DATA_ENCERRAMENTO,
          motivoEncerramento: MotivoEncerramento.RESGATE_ANTECIPADO,
        },
      });
      original.definirNota(TipoCriterio.ATENDIMENTO, 5);
      original.aceitarPolitica('v2.1');
      original.submeter();

      const criacao = paraPersistenciaCreate(original);

      // Simula o que o banco devolveria numa leitura logo em seguida:
      // mesmos escalares, notas/anexos "achatados" (sem o wrapper
      // `{ create: [...] }`, que so existe do lado da escrita).
      const registroLido: AvaliacaoPersistida = {
        ...criacao,
        politicaAceitaEm: criacao.politicaAceitaEm,
        notas: criacao.notas.create,
        anexos: criacao.anexos.create,
      };

      const reconstruido = paraDominio(registroLido);

      expect(reconstruido.id).toBe(original.id);
      expect(reconstruido.status).toBe(original.status);
      expect(reconstruido.snapshotInvestimento).toEqual(
        original.snapshotInvestimento,
      );
      const notaOriginal = original.notas.get(TipoCriterio.ATENDIMENTO);
      const notaReconstruida = reconstruido.notas.get(TipoCriterio.ATENDIMENTO);
      if (!notaOriginal || !notaReconstruida) {
        throw new Error('esperava as duas notas presentes para comparar');
      }
      expect(notaReconstruida.equals(notaOriginal)).toBe(true);
      expect(reconstruido.aceitePolitica?.obterVersao()).toBe(
        original.aceitePolitica?.obterVersao(),
      );
    });
  });
});
