import { FileTypeValidator } from '@nestjs/common';
import { TIPOS_DE_ANEXO_PERMITIDOS } from './upload-anexo.config';

// Testa o FileTypeValidator isoladamente, com buffers reais de magic
// number (nao dependente do teste manual via curl) — prova que a deteccao
// e por CONTEUDO do arquivo, nao por extensao/Content-Type declarado.
function criarArquivoFalso(
  buffer: Buffer,
  mimetypeDeclarado: string,
): Express.Multer.File {
  return {
    buffer,
    mimetype: mimetypeDeclarado,
    originalname: 'arquivo-teste',
    fieldname: 'anexos',
    encoding: '7bit',
    size: buffer.length,
  } as Express.Multer.File;
}

describe('upload-anexo.config — FileTypeValidator (magic number)', () => {
  const validator = new FileTypeValidator({
    fileType: TIPOS_DE_ANEXO_PERMITIDOS,
  });

  it('aceita um PDF real (bytes com assinatura %PDF-), mesmo com mimetype declarado diferente', async () => {
    const bufferPdfReal = Buffer.from('%PDF-1.4\n%conteudo de teste\n');
    const arquivo = criarArquivoFalso(bufferPdfReal, 'text/plain');

    await expect(validator.isValid(arquivo)).resolves.toBe(true);
  });

  it('rejeita um executavel (bytes com assinatura MZ do formato PE/DOS), mesmo declarando Content-Type: application/pdf', async () => {
    const bufferExeReal = Buffer.from([
      0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00,
      0xff, 0xff,
    ]);
    const arquivo = criarArquivoFalso(bufferExeReal, 'application/pdf');

    await expect(validator.isValid(arquivo)).resolves.toBe(false);
  });

  it('rejeita um PNG (fora da whitelist, ainda que seja um tipo de imagem valido)', async () => {
    // Assinatura real de PNG: 89 50 4E 47 0D 0A 1A 0A — usada aqui como
    // NEGATIVO proposital: JPEG e PNG estao ambos na whitelist, entao
    // testamos com GIF (47 49 46 38), que nao esta, pra confirmar que a
    // whitelist e restritiva e nao "qualquer imagem passa".
    const bufferGifReal = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
    ]);
    const arquivo = criarArquivoFalso(bufferGifReal, 'image/gif');

    await expect(validator.isValid(arquivo)).resolves.toBe(false);
  });

  it('aceita um PNG real (dentro da whitelist)', async () => {
    const bufferPngReal = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52,
    ]);
    const arquivo = criarArquivoFalso(bufferPngReal, 'application/pdf');

    await expect(validator.isValid(arquivo)).resolves.toBe(true);
  });
});
