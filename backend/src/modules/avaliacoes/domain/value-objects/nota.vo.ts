import { NotaForaDoIntervaloError } from '../errors/avaliacao.errors';

const NOTA_MINIMA = 1;
const NOTA_MAXIMA = 5;

export class Nota {
  private constructor(private readonly valor: number) {}

  static criar(valor: number): Nota {
    if (
      !Number.isInteger(valor) ||
      valor < NOTA_MINIMA ||
      valor > NOTA_MAXIMA
    ) {
      throw new NotaForaDoIntervaloError(valor);
    }
    return new Nota(valor);
  }

  obterValor(): number {
    return this.valor;
  }

  equals(outra: Nota): boolean {
    return this.valor === outra.valor;
  }
}
