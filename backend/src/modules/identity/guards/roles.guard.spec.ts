import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { RoleUsuario } from '@shared/domain/auth/authenticated-user';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = moduleRef.get(RolesGuard);
    reflector = moduleRef.get(Reflector);
  });

  function criarContextoFalso(user: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, url: '/teste' }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('permite acesso quando a rota nao exige nenhum papel especifico', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const contexto = criarContextoFalso({ id: '1', role: RoleUsuario.CLIENTE });

    expect(guard.canActivate(contexto)).toBe(true);
  });

  it('permite acesso quando o papel do usuario esta na lista exigida', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([RoleUsuario.MODERADOR]);
    const contexto = criarContextoFalso({
      id: '1',
      role: RoleUsuario.MODERADOR,
    });

    expect(guard.canActivate(contexto)).toBe(true);
  });

  it('nega acesso quando o papel do usuario nao esta na lista exigida', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([RoleUsuario.MODERADOR]);
    const contexto = criarContextoFalso({ id: '1', role: RoleUsuario.CLIENTE });

    expect(guard.canActivate(contexto)).toBe(false);
  });

  it('nega acesso quando nao ha usuario autenticado no request', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([RoleUsuario.MODERADOR]);
    const contexto = criarContextoFalso(undefined);

    expect(guard.canActivate(contexto)).toBe(false);
  });
});
