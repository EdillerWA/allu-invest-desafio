export enum RoleUsuario {
  CLIENTE = 'CLIENTE',
  MODERADOR = 'MODERADOR',
}

export interface AuthenticatedUser {
  id: string;
  role: RoleUsuario;
  email: string;
}
