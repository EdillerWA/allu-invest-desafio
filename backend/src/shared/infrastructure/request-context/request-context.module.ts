import { Module } from '@nestjs/common';
import { RequestContextProvider } from './request-context.provider';

@Module({
  providers: [RequestContextProvider],
  exports: [RequestContextProvider],
})
export class RequestContextModule {}
