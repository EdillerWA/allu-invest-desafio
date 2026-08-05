import { TamanhoDeAnexoInvalidoError } from '../errors/avaliacao.errors';

const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

interface PropsAnexo {
  readonly nomeOriginal: string;
  readonly caminhoArmazenamento: string;
  readonly tipoMime: string;
  readonly tamanhoBytes: number;
}

// VO em vez de interface simples: tamanhoBytes carrega uma invariante de
// negocio real (um anexo nao pode, por definicao, exceder 5MB) — mesmo
// motivo pelo qual Nota e VO e nao um `number` solto. A validacao aqui e
// defesa em profundidade sobre um numero ja recebido; quem de fato barra
// um upload grande demais em bytes reais (stream) e a camada de
// apresentacao (ex: limite do Multer), que nao existe ainda neste projeto.
export class Anexo {
  private readonly props: PropsAnexo;

  private constructor(props: PropsAnexo) {
    this.props = { ...props };
  }

  static criar(props: PropsAnexo): Anexo {
    if (
      !Number.isInteger(props.tamanhoBytes) ||
      props.tamanhoBytes <= 0 ||
      props.tamanhoBytes > TAMANHO_MAXIMO_BYTES
    ) {
      throw new TamanhoDeAnexoInvalidoError(props.tamanhoBytes);
    }
    return new Anexo(props);
  }

  static reconstituir(props: PropsAnexo): Anexo {
    return new Anexo(props);
  }

  obterNomeOriginal(): string {
    return this.props.nomeOriginal;
  }

  obterCaminhoArmazenamento(): string {
    return this.props.caminhoArmazenamento;
  }

  obterTipoMime(): string {
    return this.props.tipoMime;
  }

  obterTamanhoBytes(): number {
    return this.props.tamanhoBytes;
  }
}
