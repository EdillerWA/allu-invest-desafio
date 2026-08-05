import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleUsuario } from '@shared/domain/auth/authenticated-user';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleUsuario[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const usuario = request.user;
    const autorizado = !!usuario && requiredRoles.includes(usuario.role);

    if (!autorizado) {
      this.logger.warn(
        JSON.stringify({
          evento: 'autorizacao_negada',
          usuarioId: usuario?.id ?? 'desconhecido',
          roleAtual: usuario?.role ?? 'nenhuma',
          rolesExigidas: requiredRoles,
          caminho: request.url,
        }),
      );
    }

    return autorizado;
  }
}
