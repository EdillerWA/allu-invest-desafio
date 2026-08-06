import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListarMinhasAvaliacoesQueryDto } from './listar-minhas-avaliacoes-query.dto';

describe('ListarMinhasAvaliacoesQueryDto', () => {
  it('aceita ausencia de status (opcional)', async () => {
    const dto = plainToInstance(ListarMinhasAvaliacoesQueryDto, {});

    const erros = await validate(dto);

    expect(erros).toHaveLength(0);
  });

  it('aceita um valor valido do enum StatusAvaliacao', async () => {
    const dto = plainToInstance(ListarMinhasAvaliacoesQueryDto, {
      status: 'APROVADA',
    });

    const erros = await validate(dto);

    expect(erros).toHaveLength(0);
  });

  it('rejeita um valor fora do enum StatusAvaliacao', async () => {
    const dto = plainToInstance(ListarMinhasAvaliacoesQueryDto, {
      status: 'VALOR_INVENTADO',
    });

    const erros = await validate(dto);

    expect(erros.some((erro) => erro.property === 'status')).toBe(true);
  });

  it('continua validando pagina/tamanhoPagina herdados de PaginacaoQueryDto', async () => {
    const dto = plainToInstance(ListarMinhasAvaliacoesQueryDto, {
      tamanhoPagina: 51,
    });

    const erros = await validate(dto);

    expect(erros.some((erro) => erro.property === 'tamanhoPagina')).toBe(true);
  });
});
