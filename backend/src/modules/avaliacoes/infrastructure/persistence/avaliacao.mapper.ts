import {
  Avaliacao,
  MotivoEncerramento,
  StatusAvaliacao,
  TipoCriterio,
} from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { Nota } from '@modules/avaliacoes/domain/value-objects/nota.vo';
import { AceitePolitica } from '@modules/avaliacoes/domain/value-objects/aceite-politica.vo';
import { Anexo } from '@modules/avaliacoes/domain/value-objects/anexo.vo';

export interface NotaPersistida {
  criterio: TipoCriterio;
  nota: number;
}

export interface AnexoPersistido {
  id: string;
  nomeOriginal: string;
  caminhoArmazenamento: string;
  tipoMime: string;
  tamanhoBytes: number;
}

// Fronteira do mapper: so conhece formas de dado simples (esta interface),
// nunca os tipos gerados do Prisma diretamente (Decimal, payloads
// genericos com include, etc). Quem traduz o tipo especifico do client
// (ex: Decimal -> number) pro formato simples abaixo e o repositorio, no
// ponto onde a query real acontece — isso deixa o mapper testavel com
// objetos literais puros, sem precisar de um client Prisma de verdade.
export interface AvaliacaoPersistida {
  id: string;
  investimentoId: string;
  clienteId: string;
  investimentoTipoProduto: string;
  investimentoValorAplicado: number;
  investimentoDataAplicacao: Date;
  investimentoDataEncerramento: Date;
  investimentoMotivoEncerramento: MotivoEncerramento;
  status: StatusAvaliacao;
  comentario: string | null;
  motivoRejeicao: string | null;
  politicaVersaoAceita: string;
  politicaAceitaEm: Date | null;
  idempotencyKey: string | null;
  notas: NotaPersistida[];
  anexos: AnexoPersistido[];
}

export function paraDominio(registro: AvaliacaoPersistida): Avaliacao {
  if (!registro.politicaAceitaEm) {
    throw new Error(
      `Avaliacao ${registro.id} persistida sem politicaAceitaEm — invariante de dominio violada (nenhuma avaliacao deveria ser salva antes de submeter()).`,
    );
  }

  const notas = new Map<TipoCriterio, Nota>();
  for (const notaPersistida of registro.notas) {
    notas.set(notaPersistida.criterio, Nota.criar(notaPersistida.nota));
  }

  const anexos = registro.anexos.map((anexoPersistido) =>
    Anexo.reconstituir(anexoPersistido),
  );

  return Avaliacao.reconstituir({
    id: registro.id,
    investimentoId: registro.investimentoId,
    clienteId: registro.clienteId,
    snapshotInvestimento: {
      tipoProduto: registro.investimentoTipoProduto,
      valorAplicado: registro.investimentoValorAplicado,
      dataAplicacao: registro.investimentoDataAplicacao,
      dataEncerramento: registro.investimentoDataEncerramento,
      motivoEncerramento: registro.investimentoMotivoEncerramento,
    },
    status: registro.status,
    comentario: registro.comentario,
    motivoRejeicao: registro.motivoRejeicao,
    notas,
    anexos,
    aceitePolitica: AceitePolitica.reconstituir(
      registro.politicaVersaoAceita,
      registro.politicaAceitaEm,
    ),
    idempotencyKey: registro.idempotencyKey,
  });
}

export interface DadosCriacaoAvaliacao {
  id: string;
  investimentoId: string;
  clienteId: string;
  investimentoTipoProduto: string;
  investimentoValorAplicado: number;
  investimentoDataAplicacao: Date;
  investimentoDataEncerramento: Date;
  investimentoMotivoEncerramento: MotivoEncerramento;
  status: StatusAvaliacao;
  comentario: string | null;
  motivoRejeicao: string | null;
  politicaVersaoAceita: string;
  politicaAceitaEm: Date;
  idempotencyKey: string | null;
  notas: { create: NotaPersistida[] };
  anexos: { create: AnexoPersistido[] };
}

// So usado no branch de INSERT do upsert em salvar() — inclui o nested
// create de notas/anexos porque e a unica vez que essas linhas filhas
// nascem. O branch de UPDATE (paraPersistenciaUpdate) nunca reinclui isso:
// nenhum caso de uso de moderacao mexe em notas ou anexos, e reincluir o
// nested create ali colidiria com @@unique([avaliacaoId, criterio]) ou
// duplicaria linhas.
export function paraPersistenciaCreate(
  avaliacao: Avaliacao,
): DadosCriacaoAvaliacao {
  const aceitePolitica = avaliacao.aceitePolitica;
  if (!aceitePolitica) {
    throw new Error(
      `Avaliacao ${avaliacao.id} sendo persistida sem aceite de politica — invariante de dominio violada (submeter() deveria ter garantido isso antes do repositorio ser chamado).`,
    );
  }

  return {
    id: avaliacao.id,
    investimentoId: avaliacao.investimentoId,
    clienteId: avaliacao.clienteId,
    investimentoTipoProduto: avaliacao.snapshotInvestimento.tipoProduto,
    investimentoValorAplicado: avaliacao.snapshotInvestimento.valorAplicado,
    investimentoDataAplicacao: avaliacao.snapshotInvestimento.dataAplicacao,
    investimentoDataEncerramento:
      avaliacao.snapshotInvestimento.dataEncerramento,
    investimentoMotivoEncerramento:
      avaliacao.snapshotInvestimento.motivoEncerramento,
    status: avaliacao.status,
    comentario: avaliacao.comentario,
    motivoRejeicao: avaliacao.motivoRejeicao,
    politicaVersaoAceita: aceitePolitica.obterVersao(),
    politicaAceitaEm: aceitePolitica.obterDataAceite(),
    idempotencyKey: avaliacao.idempotencyKey,
    notas: {
      create: [...avaliacao.notas.entries()].map(([criterio, nota]) => ({
        criterio,
        nota: nota.obterValor(),
      })),
    },
    anexos: {
      create: avaliacao.anexos.map((anexo) => ({
        id: anexo.obterId(),
        nomeOriginal: anexo.obterNomeOriginal(),
        caminhoArmazenamento: anexo.obterCaminhoArmazenamento(),
        tipoMime: anexo.obterTipoMime(),
        tamanhoBytes: anexo.obterTamanhoBytes(),
      })),
    },
  };
}

export interface DadosAtualizacaoAvaliacao {
  status: StatusAvaliacao;
  motivoRejeicao: string | null;
}

// Todo caso de uso que passa por aqui (aprovar/rejeitar) so muda status e,
// no caso de rejeitar, motivoRejeicao — comentario/notas/anexos/politica ja
// estao fixos desde a primeira escrita (que so acontece depois de
// submeter(), nunca antes).
export function paraPersistenciaUpdate(
  avaliacao: Avaliacao,
): DadosAtualizacaoAvaliacao {
  return {
    status: avaliacao.status,
    motivoRejeicao: avaliacao.motivoRejeicao,
  };
}
