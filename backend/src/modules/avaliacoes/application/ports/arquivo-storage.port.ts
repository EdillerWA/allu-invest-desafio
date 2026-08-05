export interface ArquivoParaSalvar {
  buffer: Buffer;
  nomeOriginal: string;
  tipoMime: string;
}

export interface ArquivoSalvo {
  caminhoArmazenamento: string;
  tamanhoBytes: number;
}

export abstract class ArquivoStoragePort {
  abstract salvar(arquivo: ArquivoParaSalvar): Promise<ArquivoSalvo>;
}
