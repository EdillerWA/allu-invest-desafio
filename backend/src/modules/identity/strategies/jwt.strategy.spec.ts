import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { RoleUsuario } from '@shared/domain/auth/authenticated-user';
import { JwtPayload } from '@shared/infrastructure/auth/jwt-payload';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const valores: Record<string, string> = {
                JWT_PUBLIC_KEY:
                  '-----BEGIN PUBLIC KEY-----\nFAKE\n-----END PUBLIC KEY-----',
                JWT_ISSUER: 'allu-invest-idp',
                JWT_AUDIENCE: 'allu-invest-api',
              };
              return valores[key];
            }),
          },
        },
      ],
    }).compile();

    strategy = moduleRef.get(JwtStrategy);
  });

  function criarPayload(overrides: Partial<JwtPayload> = {}): JwtPayload {
    return {
      sub: 'cliente-123',
      role: RoleUsuario.CLIENTE,
      email: 'cliente@teste.com',
      iss: 'allu-invest-idp',
      aud: 'allu-invest-api',
      iat: 1000,
      exp: 2000,
      ...overrides,
    };
  }

  it('mapeia um payload ja assinado e verificado para AuthenticatedUser', () => {
    const usuario = strategy.validate(criarPayload());

    expect(usuario).toEqual({
      id: 'cliente-123',
      role: RoleUsuario.CLIENTE,
      email: 'cliente@teste.com',
    });
  });

  it('preserva o role de moderador vindo do payload', () => {
    const usuario = strategy.validate(
      criarPayload({ sub: 'moderador-9', role: RoleUsuario.MODERADOR }),
    );

    expect(usuario.role).toBe(RoleUsuario.MODERADOR);
  });

  it('nao inclui claims tecnicas do JWT (iss, aud, iat, exp) no AuthenticatedUser', () => {
    const usuario = strategy.validate(criarPayload());

    expect(usuario).not.toHaveProperty('iss');
    expect(usuario).not.toHaveProperty('aud');
    expect(usuario).not.toHaveProperty('iat');
    expect(usuario).not.toHaveProperty('exp');
  });
});
