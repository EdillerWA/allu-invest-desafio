import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import {
  ArquivoParaSalvar,
  ArquivoSalvo,
  ArquivoStoragePort,
} from '@modules/avaliacoes/application/ports/arquivo-storage.port';

// Salva em disco local sob FILE_STORAGE_PATH. Trocar para S3/GCS depois e
// so criar um novo adapter implementando o mesmo port — nenhum outro
// arquivo do app precisa mudar, porque ninguem fora daqui conhece o
// mecanismo de storage, so a porta.
@Injectable()
export class LocalFileStorageAdapter implements ArquivoStoragePort {
  private readonly diretorioBase: string;

  constructor(configService: ConfigService) {
    this.diretorioBase = configService.getOrThrow<string>('FILE_STORAGE_PATH');
  }

  async salvar(arquivo: ArquivoParaSalvar): Promise<ArquivoSalvo> {
    await mkdir(this.diretorioBase, { recursive: true });

    const nomeUnico = `${randomUUID()}-${arquivo.nomeOriginal}`;
    const caminhoCompleto = join(this.diretorioBase, nomeUnico);

    await writeFile(caminhoCompleto, arquivo.buffer);

    return {
      caminhoArmazenamento: caminhoCompleto,
      tamanhoBytes: arquivo.buffer.length,
    };
  }

  // caminhoArmazenamento aqui e sempre um valor que nos mesmos geramos e
  // persistimos em salvar() acima, nunca algo vindo direto de input de
  // usuario — quem chama isso (ver ObterAnexoParaDownloadHandler) resolve o
  // anexo pelo id via banco antes, entao nao ha traversal de path exposto
  // por essa funcao.
  async ler(caminhoArmazenamento: string): Promise<Buffer> {
    return readFile(caminhoArmazenamento);
  }
}
