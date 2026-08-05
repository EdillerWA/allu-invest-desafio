import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RoleUsuario } from '@shared/domain/auth/authenticated-user';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [JwtAuthGuard, Reflector],
    }).compile();

    guard = moduleRef.get(JwtAuthGuard);
    reflector = moduleRef.get(Reflector);
  });

  function criarContextoFalso(): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ url: '/api/rota-publica' }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  // canActivate: so testamos o desvio de rota publica (@Public). O caminho
  // "nao publico" delega para AuthGuard('jwt').canActivate(), que aciona a
  // verificacao criptografica real do passport-jwt — isso e responsabilidade
  // da biblioteca, ja testada por ela, e nao deve ser remockada aqui.
  describe('canActivate', () => {
    it('libera acesso sem consultar o passport quando a rota e marcada @Public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      expect(guard.canActivate(criarContextoFalso())).toBe(true);
    });
  });

  describe('handleRequest', () => {
    const contexto = criarContextoFalso();

    it('retorna o usuario quando a autenticacao foi bem-sucedida', () => {
      const usuario = {
        id: 'cliente-1',
        role: RoleUsuario.CLIENTE,
        email: 'cliente@teste.com',
      };

      expect(guard.handleRequest(null, usuario, undefined, contexto)).toBe(
        usuario,
      );
    });

    it('repropaga o erro original quando o passport retorna um erro', () => {
      const erroOriginal = new Error('falha inesperada na estrategia');

      expect(() =>
        guard.handleRequest(erroOriginal, false, undefined, contexto),
      ).toThrow(erroOriginal);
    });

    it('lanca UnauthorizedException com mensagem padrao quando nao ha usuario nem erro', () => {
      expect(() =>
        guard.handleRequest(null, false, undefined, contexto),
      ).toThrow(UnauthorizedException);
    });

    it('lanca UnauthorizedException mesmo quando o passport informa um motivo especifico', () => {
      // info.message (ex.: "jwt expired") vai para o log, nao muda o tipo da excecao lancada.
      expect(() =>
        guard.handleRequest(null, false, { message: 'jwt expired' }, contexto),
      ).toThrow(UnauthorizedException);
    });
  });
});
