import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DomainExceptionFilter } from '@shared/infrastructure/http/domain-exception.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/me sem token retorna 401', () => {
    return request(app.getHttpServer()).get('/api/me').expect(401);
  });

  it('GET /api/avaliacoes/convite/:id sem token retorna 401', () => {
    return request(app.getHttpServer())
      .get('/api/avaliacoes/convite/investimento-001')
      .expect(401);
  });

  it('GET /api/moderacao/pendentes sem token retorna 401', () => {
    return request(app.getHttpServer())
      .get('/api/moderacao/pendentes')
      .expect(401);
  });
});
