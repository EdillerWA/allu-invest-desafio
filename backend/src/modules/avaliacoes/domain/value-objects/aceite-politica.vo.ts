export class AceitePolitica {
  private constructor(
    private readonly versao: string,
    private readonly aceitaEm: Date,
  ) {}

  static criar(versao: string): AceitePolitica {
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
