import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { TipoCriterio } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { SubmeterAvaliacaoDto } from './submeter-avaliacao.dto';

function criarPayloadValido(): Record<string, unknown> {
  return {
    investimentoId: 'investimento-1',
    notas: [{ criterio: TipoCriterio.ATENDIMENTO, valor: 5 }],
    comentario: 'Otima experiencia',
    versaoPolitica: 'v1',
  };
}

describe('SubmeterAvaliacaoDto', () => {
  it('aceita payload valido completo', async () => {
    const dto = plainToInstance(SubmeterAvaliacaoDto, criarPayloadValido());

    const erros = await validate(dto);

    expect(erros).toHaveLength(0);
  });

  it('aceita payload valido sem comentario (campo opcional)', async () => {
    const payload = criarPayloadValido();
    delete payload.comentario;
    const dto = plainToInstance(SubmeterAvaliacaoDto, payload);

    const erros = await validate(dto);

    expect(erros).toHaveLength(0);
  });

  it('rejeita array de notas vazio', async () => {
    const dto = plainToInstance(SubmeterAvaliacaoDto, {
      ...criarPayloadValido(),
      notas: [],
    });

    const erros = await validate(dto);

    expect(erros.some((erro) => erro.property === 'notas')).toBe(true);
  });

  it('rejeita nota invalida aninhada (valor fora de 1-5)', async () => {
    const dto = plainToInstance(SubmeterAvaliacaoDto, {
      ...criarPayloadValido(),
      notas: [{ criterio: TipoCriterio.ATENDIMENTO, valor: 99 }],
    });

    const erros = await validate(dto);

    expect(erros.some((erro) => erro.property === 'notas')).toBe(true);
  });

  it('rejeita versaoPolitica vazia', async () => {
    const dto = plainToInstance(SubmeterAvaliacaoDto, {
      ...criarPayloadValido(),
      versaoPolitica: '',
    });

    const erros = await validate(dto);

    expect(erros.some((erro) => erro.property === 'versaoPolitica')).toBe(true);
  });

  it('rejeita investimentoId ausente', async () => {
    const payload = criarPayloadValido();
    delete payload.investimentoId;
    const dto = plainToInstance(SubmeterAvaliacaoDto, payload);

    const erros = await validate(dto);

    expect(erros.some((erro) => erro.property === 'investimentoId')).toBe(true);
  });

  it('nao declara campo clienteId na classe (deve vir sempre do usuario autenticado, nunca do body)', () => {
    // plainToInstance() sozinho NAO remove propriedades extras — quem faz
    // isso e o ValidationPipe global (whitelist+forbidNonWhitelisted, ja
    // configurado em main.ts), testado abaixo com o pipe de verdade. Este
    // teste cobre a outra metade: a classe do DTO em si nunca declara
    // clienteId, entao nenhum codigo que use SubmeterAvaliacaoDto com
    // tipagem estatica consegue ler esse campo por acidente.
    expect(Object.keys(new SubmeterAvaliacaoDto())).not.toContain('clienteId');
  });

  it('ValidationPipe global (whitelist+forbidNonWhitelisted) rejeita clienteId enviado no body', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: SubmeterAvaliacaoDto,
      data: '',
    };

    await expect(
      pipe.transform(
        { ...criarPayloadValido(), clienteId: 'cliente-forjado' },
        metadata,
      ),
    ).rejects.toThrow();
  });
});
