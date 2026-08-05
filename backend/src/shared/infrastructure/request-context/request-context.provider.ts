import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { AuthenticatedUser } from '@shared/domain/auth/authenticated-user';

@Injectable({ scope: Scope.REQUEST })
export class RequestContextProvider {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  get user(): AuthenticatedUser | undefined {
    return this.request.user;
  }
}
