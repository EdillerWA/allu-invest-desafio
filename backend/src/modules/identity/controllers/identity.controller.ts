import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { AuthenticatedUser } from '@shared/domain/auth/authenticated-user';

@Controller()
export class IdentityController {
  @Get('me')
  obterUsuarioAtual(
    @CurrentUser() usuario: AuthenticatedUser,
  ): AuthenticatedUser {
    return usuario;
  }
}
