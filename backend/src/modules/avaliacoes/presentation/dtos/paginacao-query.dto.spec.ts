import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { PaginacaoQueryDto } from './paginacao-query.dto';

describe('PaginacaoQueryDto', () => {
  it('aceita ausencia dos dois campos (ambos opcionais)', async () => {
    const dto = plainToInstance(PaginacaoQueryDto, {});

    const erros = await validate(dto);

    expect(erros).toHaveLength(0);
  });

  it('aceita pagina e tamanhoPagina validos', async () => {
    const dto = plainToInstance(PaginacaoQueryDto, {
      pagina: 2,
      tamanhoPagina: 20,
    });

    const erros = await validate(dto);

    expect(erros).toHaveLength(0);
  });

  it('rejeita tamanhoPagina acima de 50', async () => {
    const dto = plainToInstance(PaginacaoQueryDto, { tamanhoPagina: 51 });

    const erros = await validate(dto);

    expect(erros.some((erro) => erro.property === 'tamanhoPagina')).toBe(true);
  });

  it('rejeita tamanhoPagina igual a 0', async () => {
    const dto = plainToInstance(PaginacaoQueryDto, { tamanhoPagina: 0 });

    const erros = await validate(dto);

    expect(erros.some((erro) => erro.property === 'tamanhoPagina')).toBe(true);
  });

  it('rejeita pagina igual a 0', async () => {
    const dto = plainToInstance(PaginacaoQueryDto, { pagina: 0 });

    const erros = await validate(dto);

    expect(erros.some((erro) => erro.property === 'pagina')).toBe(true);
  });

  it('rejeita valores nao inteiros', async () => {
    const dto = plainToInstance(PaginacaoQueryDto, { pagina: 1.5 });

    const erros = await validate(dto);

    expect(erros.some((erro) => erro.property === 'pagina')).toBe(true);
  });

  it('nao declara campo clienteId na classe', () => {
    expect(Object.keys(new PaginacaoQueryDto())).not.toContain('clienteId');
  });

  it('ValidationPipe global rejeita clienteId enviado via query string (whitelist+forbidNonWhitelisted)', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
    const metadata: ArgumentMetadata = {
      type: 'query',
      metatype: PaginacaoQueryDto,
      data: '',
    };

    await expect(
      pipe.transform({ pagina: '1', clienteId: 'cliente-forjado' }, metadata),
    ).rejects.toThrow();
  });

  it('coerciona string de query para numero (pagina="2" -> number 2)', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
    const metadata: ArgumentMetadata = {
      type: 'query',
      metatype: PaginacaoQueryDto,
      data: '',
    };

    const resultado: unknown = await pipe.transform(
      { pagina: '2', tamanhoPagina: '15' },
      metadata,
    );

    if (!(resultado instanceof PaginacaoQueryDto)) {
      throw new Error('esperado uma instancia de PaginacaoQueryDto');
    }
    expect(resultado.pagina).toBe(2);
    expect(resultado.tamanhoPagina).toBe(15);
    expect(typeof resultado.pagina).toBe('number');
  });
});
