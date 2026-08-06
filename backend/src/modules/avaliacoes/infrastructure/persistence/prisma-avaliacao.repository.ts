import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@shared/infrastructure/prisma/prisma-client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { RequestContextProvider } from '@shared/infrastructure/request-context/request-context.provider';
import { RoleUsuario } from '@shared/domain/auth/authenticated-user';
import { AvaliacaoRepositoryPort } from '../../application/ports/avaliacao-repository.port';
import {
  Avaliacao,
  StatusAvaliacao,
  TipoCriterio,
} from '../../domain/entities/avaliacao.entity';
import {
  AvaliacaoPersistida,
  paraDominio,
  paraPersistenciaCreate,
  paraPersistenciaUpdate,
} from './avaliacao.mapper';
import { traduzirMotivoEncerramento } from '../../application/mappers/motivo-encerramento.mapper';
import { MotivoEncerramentoExterno } from '@modules/investimentos/application/ports/investimento-gateway.port';
import {
  PersistenciaFalhouError,
  PersistenciaIndisponivelError,
} from './persistencia.errors';
import { ConflitoDeModeracaoError } from '../../application/errors/orquestracao.errors';

type Paginacao = { pagina: number; tamanhoPagina: number };

// Formato minimo que uma linha "Avaliacao com notas e anexos incluidos"
// precisa ter pra virar AvaliacaoPersistida — duck-typed de proposito
// (investimentoValorAplicado aceita qualquer coisa com toNumber(), nao
// especificamente o tipo Decimal do Prisma) pra nao amarrar este arquivo
// aos tipos exatos gerados pelo client, que ja se mostraram frageis
// (ver nota no mapper sobre client desatualizado encontrado neste modulo).
//
// investimentoMotivoEncerramento vem tipado como MotivoEncerramentoExterno
// (a mesma uniao de strings que a ACL do gateway de investimentos ja usa),
// nao como o enum de dominio MotivoEncerramento — um enum TS nominal nao
// aceita direto uma string literal vinda de fora, mesmo com os mesmos
// valores. traduzirMotivoEncerramento() (ja existente, ja testada) resolve
// isso aqui do mesmo jeito que resolve pro gateway de investimentos — o
// dado vindo do banco e, pra fins de tipagem, tao "externo" quanto o dado
// vindo de um sistema terceiro.
interface LinhaComRelacoes {
  id: string;
  investimentoId: string;
  clienteId: string;
  investimentoTipoProduto: string;
  investimentoValorAplicado: { toNumber(): number };
  investimentoDataAplicacao: Date;
  investimentoDataEncerramento: Date;
  investimentoMotivoEncerramento: MotivoEncerramentoExterno;
  status: StatusPersistido;
  comentario: string | null;
  motivoRejeicao: string | null;
  politicaVersaoAceita: string;
  politicaAceitaEm: Date | null;
  idempotencyKey: string | null;
  notas: { criterio: CriterioPersistido; nota: number }[];
  anexos: {
    nomeOriginal: string;
    caminhoArmazenamento: string;
    tipoMime: string;
    tamanhoBytes: number;
  }[];
}

// Mesmo raciocinio do motivoEncerramento acima, mas para status: nao existe
// ACL formal pra isso ainda (status e sempre escrito pelo nosso proprio
// dominio, via paraPersistenciaCreate/Update), mas o enum nominal do
// TypeScript continua exigindo a mesma traducao explicita de uma string
// literal vinda do client gerado.
type StatusPersistido =
  'RASCUNHO' | 'ENVIADA' | 'EM_MODERACAO' | 'APROVADA' | 'REJEITADA';

const MAPA_STATUS: Record<StatusPersistido, StatusAvaliacao> = {
  RASCUNHO: StatusAvaliacao.RASCUNHO,
  ENVIADA: StatusAvaliacao.ENVIADA,
  EM_MODERACAO: StatusAvaliacao.EM_MODERACAO,
  APROVADA: StatusAvaliacao.APROVADA,
  REJEITADA: StatusAvaliacao.REJEITADA,
};

type CriterioPersistido =
  | 'ATENDIMENTO'
  | 'CLAREZA_INFORMACOES'
  | 'FACILIDADE_RESGATE'
  | 'RENTABILIDADE_PERCEBIDA'
  | 'RECOMENDARIA_A_OUTROS';

const MAPA_CRITERIO: Record<CriterioPersistido, TipoCriterio> = {
  ATENDIMENTO: TipoCriterio.ATENDIMENTO,
  CLAREZA_INFORMACOES: TipoCriterio.CLAREZA_INFORMACOES,
  FACILIDADE_RESGATE: TipoCriterio.FACILIDADE_RESGATE,
  RENTABILIDADE_PERCEBIDA: TipoCriterio.RENTABILIDADE_PERCEBIDA,
  RECOMENDARIA_A_OUTROS: TipoCriterio.RECOMENDARIA_A_OUTROS,
};

const INCLUDE_RELACOES = { notas: true, anexos: true } as const;

@Injectable()
export class PrismaAvaliacaoRepository implements AvaliacaoRepositoryPort {
  private readonly logger = new Logger(PrismaAvaliacaoRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextProvider,
  ) {}

  async salvar(
    avaliacao: Avaliacao,
    statusEsperado?: StatusAvaliacao,
  ): Promise<void> {
    try {
      await this.executarComContexto(async (tx) => {
        const existente = await tx.avaliacao.findUnique({
          where: { id: avaliacao.id },
        });

        if (existente) {
          if (statusEsperado) {
            // updateMany (nao update) porque o WHERE inclui status: so
            // assim da pra saber, pelo count, se a linha ainda estava no
            // status esperado no momento da escrita — update() com um
            // WHERE que nao bate simplesmente lançaria "record not found",
            // nao devolveria uma contagem pra diferenciar dos outros erros.
            const resultado = await tx.avaliacao.updateMany({
              where: { id: avaliacao.id, status: statusEsperado },
              data: paraPersistenciaUpdate(avaliacao),
            });
            if (resultado.count === 0) {
              throw new ConflitoDeModeracaoError(avaliacao.id);
            }
          } else {
            await tx.avaliacao.update({
              where: { id: avaliacao.id },
              data: paraPersistenciaUpdate(avaliacao),
            });
          }
        } else {
          await tx.avaliacao.create({
            data: paraPersistenciaCreate(avaliacao),
          });
        }
      });
    } catch (erro) {
      throw this.traduzirErroDePersistencia(erro);
    }
  }

  async buscarPorId(id: string): Promise<Avaliacao | null> {
    try {
      return await this.executarComContexto(async (tx) => {
        const registro = await tx.avaliacao.findUnique({
          where: { id },
          include: INCLUDE_RELACOES,
        });
        return registro ? paraDominio(this.paraLinhaMapeavel(registro)) : null;
      });
    } catch (erro) {
      throw this.traduzirErroDePersistencia(erro);
    }
  }

  async buscarPorInvestimentoId(
    investimentoId: string,
  ): Promise<Avaliacao | null> {
    try {
      return await this.executarComContexto(async (tx) => {
        const registro = await tx.avaliacao.findUnique({
          where: { investimentoId },
          include: INCLUDE_RELACOES,
        });
        return registro ? paraDominio(this.paraLinhaMapeavel(registro)) : null;
      });
    } catch (erro) {
      throw this.traduzirErroDePersistencia(erro);
    }
  }

  async buscarPorIdempotencyKey(chave: string): Promise<Avaliacao | null> {
    try {
      return await this.executarComContexto(async (tx) => {
        const registro = await tx.avaliacao.findUnique({
          where: { idempotencyKey: chave },
          include: INCLUDE_RELACOES,
        });
        return registro ? paraDominio(this.paraLinhaMapeavel(registro)) : null;
      });
    } catch (erro) {
      throw this.traduzirErroDePersistencia(erro);
    }
  }

  async listarPorCliente(
    clienteId: string,
    paginacao: Paginacao,
    filtro?: { status?: StatusAvaliacao; q?: string },
  ): Promise<{ itens: Avaliacao[]; total: number }> {
    try {
      return await this.executarComContexto(async (tx) => {
        // Defesa em profundidade: o clienteId pedido precisa bater com o
        // do usuario autenticado da requisicao, a menos que seja
        // moderador. Nao depende so do RLS pra isso — RLS pode estar mal
        // configurado (ver achado do superuser no historico deste
        // modulo) e essa checagem continua valendo mesmo assim.
        const usuario = this.requestContext.user;
        const ehModerador = usuario?.role === RoleUsuario.MODERADOR;
        if (!ehModerador && usuario?.id !== clienteId) {
          return { itens: [], total: 0 };
        }

        return this.buscarPaginado(
          tx,
          {
            clienteId,
            ...(filtro?.status ? { status: filtro.status } : {}),
            ...(filtro?.q
              ? {
                  investimentoTipoProduto: {
                    contains: filtro.q,
                    mode: 'insensitive',
                  },
                }
              : {}),
          },
          paginacao,
        );
      });
    } catch (erro) {
      throw this.traduzirErroDePersistencia(erro);
    }
  }

  async listarPendentesDeModeracao(
    paginacao: Paginacao,
    filtro?: { q?: string },
  ): Promise<{ itens: Avaliacao[]; total: number }> {
    try {
      return await this.executarComContexto(async (tx) => {
        const ehModerador =
          this.requestContext.user?.role === RoleUsuario.MODERADOR;
        if (!ehModerador) {
          return { itens: [], total: 0 };
        }

        return this.buscarPaginado(
          tx,
          {
            status: {
              in: [StatusAvaliacao.ENVIADA, StatusAvaliacao.EM_MODERACAO],
            },
            ...(filtro?.q
              ? {
                  OR: [
                    {
                      investimentoTipoProduto: {
                        contains: filtro.q,
                        mode: 'insensitive',
                      },
                    },
                    { clienteId: { contains: filtro.q, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
          paginacao,
        );
      });
    } catch (erro) {
      throw this.traduzirErroDePersistencia(erro);
    }
  }

  async listarPublicasAprovadas(
    investimentoId: string,
    paginacao: Paginacao,
  ): Promise<{ itens: Avaliacao[]; total: number }> {
    try {
      return await this.executarComContexto(async (tx) =>
        this.buscarPaginado(
          tx,
          { investimentoId, status: StatusAvaliacao.APROVADA },
          paginacao,
        ),
      );
    } catch (erro) {
      throw this.traduzirErroDePersistencia(erro);
    }
  }

  private async buscarPaginado(
    tx: Prisma.TransactionClient,
    where: Prisma.AvaliacaoWhereInput,
    paginacao: Paginacao,
  ): Promise<{ itens: Avaliacao[]; total: number }> {
    const skip = (paginacao.pagina - 1) * paginacao.tamanhoPagina;

    const [registros, total] = await Promise.all([
      tx.avaliacao.findMany({
        where,
        include: INCLUDE_RELACOES,
        skip,
        take: paginacao.tamanhoPagina,
        orderBy: { createdAt: 'desc' },
      }),
      tx.avaliacao.count({ where }),
    ]);

    return {
      itens: registros.map((registro) =>
        paraDominio(this.paraLinhaMapeavel(registro)),
      ),
      total,
    };
  }

  private paraLinhaMapeavel(registro: LinhaComRelacoes): AvaliacaoPersistida {
    return {
      ...registro,
      investimentoValorAplicado: registro.investimentoValorAplicado.toNumber(),
      investimentoMotivoEncerramento: traduzirMotivoEncerramento(
        registro.investimentoMotivoEncerramento,
      ),
      status: MAPA_STATUS[registro.status],
      notas: registro.notas.map((nota) => ({
        criterio: MAPA_CRITERIO[nota.criterio],
        nota: nota.nota,
      })),
    };
  }

  // SET LOCAL nao aceita parametro via placeholder do jeito que
  // $executeRaw normalmente parametriza — set_config() e a forma segura
  // (evita injecao) de setar as duas variaveis de sessao que as policies
  // de RLS leem, dentro da MESMA transacao/conexao fisica da query. Rodar
  // isso fora de uma transacao interativa (ex: SET SESSION solto) vazaria
  // o contexto de um cliente pra proxima requisicao que reusar a mesma
  // conexao do pool — ver docs/AUTH_FLOW.md/plano do Modulo 3 pra o
  // raciocinio completo.
  private async executarComContexto<T>(
    operacao: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const usuario = this.requestContext.user;
    const role = usuario?.role ?? '';
    // Cuidado proposital: quando o usuario e MODERADOR, usuario.id NAO e
    // um clienteId — nunca usar aqui, mesmo sendo inofensivo hoje (nunca
    // bateria com nenhuma linha), pra nao deixar semantica errada
    // implicita no codigo.
    const clienteId =
      usuario && usuario.role !== RoleUsuario.MODERADOR ? usuario.id : '';

    return this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_cliente_id', ${clienteId}, true), set_config('app.current_role', ${role}, true)`;
      return operacao(tx);
    });
  }

  private traduzirErroDePersistencia(erro: unknown): Error {
    // Lançado por nos mesmos dentro da transacao (ver salvar() acima), nao
    // e falha de infraestrutura — precisa propagar intacto pro handler
    // decidir, igual ao P2002 de idempotencia logo abaixo.
    if (erro instanceof ConflitoDeModeracaoError) {
      return erro;
    }

    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 (constraint unica) precisa propagar intacto: e o handler
      // (SubmeterAvaliacaoHandler) quem decide o que fazer com isso —
      // reconsultar idempotencia e devolver o existente, nao virar 500.
      if (erro.code === 'P2002') {
        return erro;
      }

      this.logger.error(
        `Erro de persistencia nao tratado (codigo ${erro.code}): ${erro.message}`,
      );
      return new PersistenciaFalhouError(erro.code);
    }

    if (erro instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error(`Banco de dados indisponivel: ${erro.message}`);
      return new PersistenciaIndisponivelError();
    }

    // Com o driver adapter (@prisma/adapter-pg), uma falha de conexao real
    // (Postgres fora do ar) NAO chega como PrismaClientInitializationError
    // — chega como AggregateError cru vindo direto do pool do node-postgres
    // (confirmado empiricamente derrubando o container: erro.code ===
    // 'ECONNREFUSED', sem nenhum wrapper do Prisma). Sem esta checagem, o
    // stack trace do driver (incluindo host/porta internos) vazaria intacto
    // pelo passthrough generico abaixo.
    if (erro instanceof AggregateError && 'code' in erro) {
      const codigo: unknown = erro.code;
      if (codigo === 'ECONNREFUSED') {
        this.logger.error('Banco de dados indisponivel (conexao recusada).');
        return new PersistenciaIndisponivelError();
      }
    }

    if (erro instanceof Error) {
      this.logger.error(
        `Erro de persistencia nao mapeado (${erro.constructor.name}): ${erro.message}`,
      );
      return new PersistenciaFalhouError('DESCONHECIDO');
    }

    return new Error('Erro desconhecido de persistencia.');
  }
}
