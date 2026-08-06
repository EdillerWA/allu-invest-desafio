export type RoleUsuario = 'CLIENTE' | 'MODERADOR'

/**
 * O backend declara `email` como obrigatório em `AuthenticatedUser`, mas o
 * script de geração de token de teste assina o JWT só com `{sub, role}` — em
 * runtime `email` fica `undefined` e a chave some da resposta JSON. Tratamos
 * como opcional aqui de propósito, não como suposição otimista do tipo.
 */
export interface UsuarioAutenticado {
  id: string
  role: RoleUsuario
  email?: string
}
