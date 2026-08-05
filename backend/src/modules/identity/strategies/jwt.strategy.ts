import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '@shared/domain/auth/authenticated-user';
import { JwtPayload } from '@shared/infrastructure/auth/jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKey: configService.getOrThrow<string>('JWT_PUBLIC_KEY'),
      issuer: configService.getOrThrow<string>('JWT_ISSUER'),
      audience: configService.getOrThrow<string>('JWT_AUDIENCE'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    this.logger.debug(
      JSON.stringify({
        evento: 'token_validado',
        usuarioId: payload.sub,
        role: payload.role,
      }),
    );

    return {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
  }
}
