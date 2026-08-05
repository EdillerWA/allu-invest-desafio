// Whitelist de tipo por magic number (conteudo real do arquivo, nao a
// extensao/mimetype que o cliente afirma) — FileTypeValidator do Nest 11
// inspeciona os bytes via o pacote `file-type`. Um .exe renomeado pra
// .pdf falha aqui mesmo declarando Content-Type: application/pdf.
//
// Extraido do controller pra ser testavel isoladamente (ver
// upload-anexo.config.spec.ts) sem duplicar a regex — um teste que
// reconstruisse a mesma expressao por conta propria divergiria em
// silencio se o controller mudasse a regra sem atualizar o teste.
export const TIPOS_DE_ANEXO_PERMITIDOS =
  /^(application\/pdf|image\/jpeg|image\/png)$/;
export const TAMANHO_MAXIMO_ANEXO_BYTES = 5 * 1024 * 1024;
export const MAXIMO_DE_ANEXOS_POR_REQUISICAO = 3;
