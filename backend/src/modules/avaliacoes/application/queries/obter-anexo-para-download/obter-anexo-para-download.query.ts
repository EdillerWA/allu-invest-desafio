import { AuthenticatedUser } from '@shared/domain/auth/authenticated-user';

export class ObterAnexoParaDownloadQuery {
  constructor(
    readonly avaliacaoId: string,
    readonly anexoId: string,
    readonly usuarioAutenticado: AuthenticatedUser,
  ) {}
}
