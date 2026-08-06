import { Anexo } from './anexo.vo';
import { TamanhoDeAnexoInvalidoError } from '../errors/avaliacao.errors';

function propsValidas(tamanhoBytes: number) {
  return {
    nomeOriginal: 'comprovante.pdf',
    caminhoArmazenamento: '/anexos/comprovante.pdf',
    tipoMime: 'application/pdf',
    tamanhoBytes,
  };
}

describe('Anexo', () => {
  describe('criar', () => {
    it('aceita um tamanho valido dentro do limite', () => {
      const anexo = Anexo.criar(propsValidas(1024));

      expect(anexo.obterTamanhoBytes()).toBe(1024);
    });

    it('gera um id proprio, diferente a cada anexo criado', () => {
      const anexo1 = Anexo.criar(propsValidas(1024));
      const anexo2 = Anexo.criar(propsValidas(1024));

      expect(typeof anexo1.obterId()).toBe('string');
      expect(anexo1.obterId().length).toBeGreaterThan(0);
      expect(anexo1.obterId()).not.toBe(anexo2.obterId());
    });

    it('aceita exatamente o limite maximo de 5MB', () => {
      const anexo = Anexo.criar(propsValidas(5 * 1024 * 1024));

      expect(anexo.obterTamanhoBytes()).toBe(5 * 1024 * 1024);
    });

    it('rejeita tamanho zero', () => {
      expect(() => Anexo.criar(propsValidas(0))).toThrow(
        TamanhoDeAnexoInvalidoError,
      );
    });

    it('rejeita tamanho negativo', () => {
      expect(() => Anexo.criar(propsValidas(-1))).toThrow(
        TamanhoDeAnexoInvalidoError,
      );
    });

    it('rejeita tamanho acima de 5MB', () => {
      expect(() => Anexo.criar(propsValidas(5 * 1024 * 1024 + 1))).toThrow(
        TamanhoDeAnexoInvalidoError,
      );
    });

    it('rejeita tamanho NaN', () => {
      expect(() => Anexo.criar(propsValidas(NaN))).toThrow(
        TamanhoDeAnexoInvalidoError,
      );
    });

    it('rejeita tamanho fracionario', () => {
      expect(() => Anexo.criar(propsValidas(100.5))).toThrow(
        TamanhoDeAnexoInvalidoError,
      );
    });
  });
});
