import { VersaoDePoliticaInvalidaError } from '../errors/avaliacao.errors';

export class AceitePolitica {
  private constructor(
    private readonly versao: string,
    private readonly aceitaEm: Date,
  ) {}

  static criar(versao: string): AceitePolitica {
    if (!versao || versao.trim().length === 0) {
      throw new VersaoDePoliticaInvalidaError();
    }
    return new AceitePolitica(versao, new Date());
  }

  static reconstituir(versao: string, aceitaEm: Date): AceitePolitica {
    return new AceitePolitica(versao, aceitaEm);
  }

  obterVersao(): string {
    return this.versao;
  }

  obterDataAceite(): Date {
    return this.aceitaEm;
  }
}
