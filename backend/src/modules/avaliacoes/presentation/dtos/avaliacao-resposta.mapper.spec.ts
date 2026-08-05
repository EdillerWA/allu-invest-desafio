import {
  Avaliacao,
  MotivoEncerramento,
  TipoCriterio,
} from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { Anexo } from '@modules/avaliacoes/domain/value-objects/anexo.vo';
import { paraResposta } from './avaliacao-resposta.mapper';

describe('avaliacao-resposta.mapper', () => {
  it('traduz o aggregate para um objeto plano serializavel, sem vazar caminhoArmazenamento', () => {
    const avaliacao = Avaliacao.criarConvite({
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
    avaliacao.definirNota(TipoCriterio.ATENDIMENTO, 5);
    avaliacao.adicionarAnexo(
      Anexo.criar({
        nomeOriginal: 'comprovante.pdf',
        caminhoArmazenamento: '/storage/interno/uuid-comprovante.pdf',
        tipoMime: 'application/pdf',
        tamanhoBytes: 2048,
      }),
    );
    avaliacao.definirComentario('Otima experiencia');
    avaliacao.aceitarPolitica('v1');
    avaliacao.submeter();

    const resposta = paraResposta(avaliacao);

    expect(resposta.id).toBe('avaliacao-1');
    expect(resposta.status).toBe('ENVIADA');
    expect(resposta.comentario).toBe('Otima experiencia');
    expect(resposta.notas).toEqual([
      { criterio: TipoCriterio.ATENDIMENTO, valor: 5 },
    ]);
    expect(resposta.anexos).toEqual([
      {
        nomeOriginal: 'comprovante.pdf',
        tipoMime: 'application/pdf',
        tamanhoBytes: 2048,
      },
    ]);
    // Path de armazenamento interno nao pode vazar na resposta HTTP.
    expect(JSON.stringify(resposta)).not.toContain('/storage/interno');
    expect(resposta.aceitePolitica?.versao).toBe('v1');
    expect(resposta.investimento.tipoProduto).toBe('CDB');
  });

  it('aceitePolitica null quando a avaliacao ainda nao foi submetida', () => {
    const avaliacao = Avaliacao.criarConvite({
      id: 'avaliacao-2',
      investimentoId: 'investimento-2',
      clienteId: 'cliente-1',
      snapshotInvestimento: {
        tipoProduto: 'LCI',
        valorAplicado: 500,
        dataAplicacao: new Date('2025-01-01'),
        dataEncerramento: new Date('2026-01-01'),
        motivoEncerramento: MotivoEncerramento.OUTRO,
      },
    });

    const resposta = paraResposta(avaliacao);

    expect(resposta.aceitePolitica).toBeNull();
    expect(resposta.notas).toEqual([]);
    expect(resposta.anexos).toEqual([]);
  });
});
