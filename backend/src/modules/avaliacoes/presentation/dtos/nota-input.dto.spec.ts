import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TipoCriterio } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { NotaInputDto } from './nota-input.dto';

describe('NotaInputDto', () => {
  it('aceita nota valida (criterio conhecido, valor entre 1 e 5)', async () => {
    const dto = plainToInstance(NotaInputDto, {
      criterio: TipoCriterio.ATENDIMENTO,
      valor: 5,
    });

    const erros = await validate(dto);

    expect(erros).toHaveLength(0);
  });

  it('rejeita nota fora do intervalo 1-5 (acima)', async () => {
    const dto = plainToInstance(NotaInputDto, {
      criterio: TipoCriterio.ATENDIMENTO,
      valor: 6,
    });

    const erros = await validate(dto);

    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0].property).toBe('valor');
  });

  it('rejeita nota fora do intervalo 1-5 (abaixo)', async () => {
    const dto = plainToInstance(NotaInputDto, {
      criterio: TipoCriterio.ATENDIMENTO,
      valor: 0,
    });

    const erros = await validate(dto);

    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0].property).toBe('valor');
  });

  it('rejeita criterio desconhecido (fora do enum TipoCriterio)', async () => {
    const dto = plainToInstance(NotaInputDto, {
      criterio: 'CRITERIO_QUE_NAO_EXISTE',
      valor: 5,
    });

    const erros = await validate(dto);

    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0].property).toBe('criterio');
  });
});
