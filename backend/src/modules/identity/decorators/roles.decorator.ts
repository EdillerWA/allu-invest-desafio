import { SetMetadata } from '@nestjs/common';
import { RoleUsuario } from '@shared/domain/auth/authenticated-user';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleUsuario[]) => SetMetadata(ROLES_KEY, roles);
