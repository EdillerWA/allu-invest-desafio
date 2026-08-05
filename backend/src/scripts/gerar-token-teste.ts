import { readFileSync } from 'fs';
import { sign } from 'jsonwebtoken';
import { RoleUsuario } from '@shared/domain/auth/authenticated-user';

const privateKey = readFileSync('keys/private.pem', 'utf8');

const [, , roleArg, idArg] = process.argv;
const role =
  roleArg === 'moderador' ? RoleUsuario.MODERADOR : RoleUsuario.CLIENTE;
const id = idArg ?? 'cliente-teste-001';

const token = sign(
  {
    sub: id,
    role,
  },
  privateKey,
  {
    algorithm: 'RS256',
    issuer: 'allu-invest-idp',
    audience: 'allu-invest-api',
    expiresIn: '1h',
  },
);

console.log(token);
