import { RoleUsuario } from '@shared/domain/auth/authenticated-user';

export interface JwtPayload {
  sub: string;
  role: RoleUsuario;
  email: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}
