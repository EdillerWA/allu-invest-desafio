import { AuthenticatedUser } from '@shared/domain/auth/authenticated-user';

// @types/passport ja declara `Express.Request.user?: Express.User`.
// Estender `Express.User` (em vez de redeclarar `Request.user`) e o jeito
// correto de tipar isso sem colidir com a declaracao existente da lib.
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AuthenticatedUser {}
  }
}
