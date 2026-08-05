import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from '@shared/infrastructure/http/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  app.use(helmet());

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new DomainExceptionFilter());

  const allowedOrigins = configService
    .get<string>('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({ origin: allowedOrigins, credentials: true });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Aplicacao rodando em http://localhost:${port}/api`);
}

void bootstrap();
