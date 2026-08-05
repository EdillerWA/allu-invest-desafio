import { traduzirMotivoEncerramento } from './motivo-encerramento.mapper';
import { MotivoEncerramento } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { MotivoEncerramentoExterno } from '@modules/investimentos/application/ports/investimento-gateway.port';
import { MotivoEncerramentoDesconhecidoError } from '../errors/orquestracao.errors';

describe('traduzirMotivoEncerramento', () => {
  it('traduz cada valor externo conhecido para o enum de dominio correspondente', () => {
    expect(traduzirMotivoEncerramento('VENCIMENTO')).toBe(
      MotivoEncerramento.VENCIMENTO,
    );
    expect(traduzirMotivoEncerramento('RESGATE_ANTECIPADO')).toBe(
      MotivoEncerramento.RESGATE_ANTECIPADO,
    );
    expect(traduzirMotivoEncerramento('OUTRO')).toBe(MotivoEncerramento.OUTRO);
  });

  it('lanca MotivoEncerramentoDesconhecidoError para um valor fora do union conhecido', () => {
    // Cast necessario de proposito: o parametro e tipado como o union
    // MotivoEncerramentoExterno, mas o valor real vem desserializado de um
    // sistema externo em runtime, sem garantia nenhuma do TypeScript — este
    // teste simula exatamente o caso que a checagem em runtime existe para
    // cobrir.
    const valorInesperado = 'CANCELADO' as MotivoEncerramentoExterno;

    expect(() => traduzirMotivoEncerramento(valorInesperado)).toThrow(
      MotivoEncerramentoDesconhecidoError,
    );
  });
});
