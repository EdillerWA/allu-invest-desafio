import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { RejeitarAvaliacaoDto } from './rejeitar-avaliacao.dto';

describe('RejeitarAvaliacaoDto', () => {
  it('aceita motivo valido', async () => {
    const dto = plainToInstance(RejeitarAvaliacaoDto, {
      motivo: 'Comentario incompativel com as notas dadas.',
    });

    const erros = await validate(dto);

    expect(erros).toHaveLength(0);
  });

  it('rejeita motivo vazio', async () => {
    const dto = plainToInstance(RejeitarAvaliacaoDto, { motivo: '' });

    const erros = await validate(dto);

    expect(erros.some((erro) => erro.property === 'motivo')).toBe(true);
  });

  it('rejeita motivo ausente', async () => {
    const dto = plainToInstance(RejeitarAvaliacaoDto, {});

    const erros = await validate(dto);

    expect(erros.some((erro) => erro.property === 'motivo')).toBe(true);
  });

  it('nao declara campo clienteId na classe', () => {
    expect(Object.keys(new RejeitarAvaliacaoDto())).not.toContain('clienteId');
  });

  it('ValidationPipe global rejeita clienteId enviado no body (whitelist+forbidNonWhitelisted)', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: RejeitarAvaliacaoDto,
      data: '',
    };

    await expect(
      pipe.transform(
        { motivo: 'motivo valido', clienteId: 'cliente-forjado' },
        metadata,
      ),
    ).rejects.toThrow();
  });
});
