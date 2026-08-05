import {
  Avaliacao,
  StatusAvaliacao,
  TipoCriterio,
  MotivoEncerramento,
} from './avaliacao.entity';
import {
  TransicaoInvalidaError,
  CriterioDuplicadoError,
  PoliticaNaoAceitaError,
  NenhumCriterioAvaliadoError,
  MotivoRejeicaoObrigatorioError,
  NotaForaDoIntervaloError,
} from '../errors/avaliacao.errors';

function criarAvaliacaoDeTeste(): Avaliacao {
  return Avaliacao.criarConvite({
    id: 'avaliacao-1',
    investimentoId: 'investimento-1',
    clienteId: 'cliente-1',
    snapshotInvestimento: {
      tipoProduto: 'CDB',
      valorAplicado: 1000,
      dataAplicacao: new Date('2025-01-01'),
      dataEncerramento: new Date('2026-01-01'),
      motivoEncerramento: MotivoEncerramento.VENCIMENTO,
    },
  });
}

describe('Avaliacao', () => {
  describe('criacao', () => {
    it('nasce em RASCUNHO, sem notas, sem aceite de politica', () => {
      const avaliacao = criarAvaliacaoDeTeste();

      expect(avaliacao.status).toBe(StatusAvaliacao.RASCUNHO);
      expect(avaliacao.notas.size).toBe(0);
      expect(avaliacao.aceitePolitica).toBeNull();
    });
  });

  describe('definirNota', () => {
    it('aceita uma nota valida para um criterio', () => {
      const avaliacao = criarAvaliacaoDeTeste();
      avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 5);

      expect(avaliacao.notas.get(TipoCriterio.ATENDIMENTO)?.obterValor()).toBe(
        5,
      );
    });

    it('rejeita nota fora do intervalo permitido', () => {
      const avaliacao = criarAvaliacaoDeTeste();

      expect(() => avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 6)).toThrow(
        NotaForaDoIntervaloError,
      );
    });

    it('rejeita o mesmo criterio sendo avaliado duas vezes', () => {
      const avaliacao = criarAvaliacaoDeTeste();
      avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 4);

      expect(() => avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 5)).toThrow(
        CriterioDuplicadoError,
      );
    });

    it('rejeita definir nota fora do status RASCUNHO', () => {
      const avaliacao = criarAvaliacaoDeTeste();
      avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 4);
      avaliacao.aceitarPolitica('v1');
      avaliacao.submeter();

      expect(() =>
        avaliacao.definirNota(TipoCriterio.CLAREZA_INFORMACOES, 3),
      ).toThrow(TransicaoInvalidaError);
    });
  });

  describe('submeter', () => {
    it('exige ao menos uma nota', () => {
      const avaliacao = criarAvaliacaoDeTeste();
      avaliacao.aceitarPolitica('v1');

      expect(() => avaliacao.submeter()).toThrow(NenhumCriterioAvaliadoError);
    });

    it('exige aceite de politica', () => {
      const avaliacao = criarAvaliacaoDeTeste();
      avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 5);

      expect(() => avaliacao.submeter()).toThrow(PoliticaNaoAceitaError);
    });

    it('transiciona para ENVIADA quando as condicoes sao atendidas', () => {
      const avaliacao = criarAvaliacaoDeTeste();
      avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 5);
      avaliacao.aceitarPolitica('v1');
      avaliacao.submeter();

      expect(avaliacao.status).toBe(StatusAvaliacao.ENVIADA);
    });

    it('registra o evento AvaliacaoSubmetidaEvent', () => {
      const avaliacao = criarAvaliacaoDeTeste();
      avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 5);
      avaliacao.aceitarPolitica('v1');
      avaliacao.submeter();

      const eventos = avaliacao.liberarEventos();
      expect(eventos).toHaveLength(1);
      expect(eventos[0].nomeEvento).toBe('avaliacao.submetida');
    });

    it('rejeita submeter novamente uma avaliacao ja enviada', () => {
      const avaliacao = criarAvaliacaoDeTeste();
      avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 5);
      avaliacao.aceitarPolitica('v1');
      avaliacao.submeter();

      expect(() => avaliacao.submeter()).toThrow(TransicaoInvalidaError);
    });
  });

  describe('fluxo de moderacao', () => {
    function criarAvaliacaoEnviada(): Avaliacao {
      const avaliacao = criarAvaliacaoDeTeste();
      avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 5);
      avaliacao.aceitarPolitica('v1');
      avaliacao.submeter();
      avaliacao.liberarEventos();
      return avaliacao;
    }

    it('nao permite aprovar direto de ENVIADA, sem passar por EM_MODERACAO', () => {
      const avaliacao = criarAvaliacaoEnviada();

      expect(() => avaliacao.aprovar('moderador-1')).toThrow(
        TransicaoInvalidaError,
      );
    });

    it('permite aprovar apos enviar para moderacao', () => {
      const avaliacao = criarAvaliacaoEnviada();
      avaliacao.enviarParaModeracao();
      avaliacao.aprovar('moderador-1');

      expect(avaliacao.status).toBe(StatusAvaliacao.APROVADA);
    });

    it('exige motivo ao rejeitar', () => {
      const avaliacao = criarAvaliacaoEnviada();
      avaliacao.enviarParaModeracao();

      expect(() => avaliacao.rejeitar('moderador-1', '')).toThrow(
        MotivoRejeicaoObrigatorioError,
      );
    });

    it('permite rejeitar com motivo valido', () => {
      const avaliacao = criarAvaliacaoEnviada();
      avaliacao.enviarParaModeracao();
      avaliacao.rejeitar('moderador-1', 'Comentario ofensivo');

      expect(avaliacao.status).toBe(StatusAvaliacao.REJEITADA);
    });

    it('nao permite transicionar a partir de um status final (APROVADA)', () => {
      const avaliacao = criarAvaliacaoEnviada();
      avaliacao.enviarParaModeracao();
      avaliacao.aprovar('moderador-1');

      expect(() => avaliacao.rejeitar('moderador-1', 'motivo')).toThrow(
        TransicaoInvalidaError,
      );
    });

    it('registra o evento AvaliacaoModeradaEvent com o resultado correto', () => {
      const avaliacao = criarAvaliacaoEnviada();
      avaliacao.enviarParaModeracao();
      avaliacao.rejeitar('moderador-1', 'Linguagem inadequada');

      const eventos = avaliacao.liberarEventos();
      expect(eventos).toHaveLength(1);
      expect(eventos[0].nomeEvento).toBe('avaliacao.moderada');
    });
  });
});
