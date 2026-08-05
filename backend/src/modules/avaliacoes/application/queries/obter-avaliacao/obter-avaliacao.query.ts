import { AuthenticatedUser } from '@shared/domain/auth/authenticated-user';

export class ObterAvaliacaoQuery {
  constructor(
    readonly avaliacaoId: string,
    readonly usuarioAutenticado: AuthenticatedUser,
  ) {}
}
