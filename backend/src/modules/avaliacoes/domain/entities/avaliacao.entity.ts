import { AggregateRoot } from '@shared/domain/aggregate-root';
import { Nota } from '../value-objects/nota.vo';
import { AceitePolitica } from '../value-objects/aceite-politica.vo';
import { AvaliacaoSubmetidaEvent } from '../events/avaliacao-submetida.event';
import { AvaliacaoModeradaEvent } from '../events/avaliacao-moderada.event';
import {
  TransicaoInvalidaError,
  CriterioDuplicadoError,
  PoliticaNaoAceitaError,
  NenhumCriterioAvaliadoError,
  MotivoRejeicaoObrigatorioError,
} from '../errors/avaliacao.errors';

export enum StatusAvaliacao {
  RASCUNHO = 'RASCUNHO',
  ENVIADA = 'ENVIADA',
  EM_MODERACAO = 'EM_MODERACAO',
  APROVADA = 'APROVADA',
  REJEITADA = 'REJEITADA',
}

export enum TipoCriterio {
  ATENDIMENTO = 'ATENDIMENTO',
  CLAREZA_INFORMACOES = 'CLAREZA_INFORMACOES',
  FACILIDADE_RESGATE = 'FACILIDADE_RESGATE',
  RENTABILIDADE_PERCEBIDA = 'RENTABILIDADE_PERCEBIDA',
  RECOMENDARIA_A_OUTROS = 'RECOMENDARIA_A_OUTROS',
}

export enum MotivoEncerramento {
  VENCIMENTO = 'VENCIMENTO',
  RESGATE_ANTECIPADO = 'RESGATE_ANTECIPADO',
  OUTRO = 'OUTRO',
}

// Transicoes permitidas da state machine. Qualquer transicao fora deste
// mapa e rejeitada com TransicaoInvalidaError.
const TRANSICOES_PERMITIDAS: Record<StatusAvaliacao, StatusAvaliacao[]> = {
  [StatusAvaliacao.RASCUNHO]: [StatusAvaliacao.ENVIADA],
  [StatusAvaliacao.ENVIADA]: [StatusAvaliacao.EM_MODERACAO],
  [StatusAvaliacao.EM_MODERACAO]: [
    StatusAvaliacao.APROVADA,
    StatusAvaliacao.REJEITADA,
  ],
  [StatusAvaliacao.APROVADA]: [],
  [StatusAvaliacao.REJEITADA]: [],
};

interface SnapshotInvestimento {
  tipoProduto: string;
  valorAplicado: number;
  dataAplicacao: Date;
  dataEncerramento: Date;
  motivoEncerramento: MotivoEncerramento;
}

interface PropsAvaliacao {
  id: string;
  investimentoId: string;
  clienteId: string;
  snapshotInvestimento: SnapshotInvestimento;
  status: StatusAvaliacao;
  comentario: string | null;
  notas: Map<TipoCriterio, Nota>;
  aceitePolitica: AceitePolitica | null;
  idempotencyKey: string | null;
}

export class Avaliacao extends AggregateRoot {
  private constructor(private props: PropsAvaliacao) {
    super();
  }

  // --- Fabricas ---

  static criarConvite(params: {
    id: string;
    investimentoId: string;
    clienteId: string;
    snapshotInvestimento: SnapshotInvestimento;
  }): Avaliacao {
    return new Avaliacao({
      id: params.id,
      investimentoId: params.investimentoId,
      clienteId: params.clienteId,
      snapshotInvestimento: params.snapshotInvestimento,
      status: StatusAvaliacao.RASCUNHO,
      comentario: null,
      notas: new Map(),
      aceitePolitica: null,
      idempotencyKey: null,
    });
  }

  static reconstituir(props: PropsAvaliacao): Avaliacao {
    return new Avaliacao(props);
  }

  // --- Comportamento de dominio ---

  definirNota(criterio: TipoCriterio, valor: number): void {
    this.garantirTransicaoPermitida(StatusAvaliacao.RASCUNHO);

    if (this.props.notas.has(criterio)) {
      throw new CriterioDuplicadoError(criterio);
    }

    this.props.notas.set(criterio, Nota.criar(valor));
  }

  definirComentario(comentario: string | null): void {
    this.props.comentario = comentario;
  }

  aceitarPolitica(versao: string): void {
    this.props.aceitePolitica = AceitePolitica.criar(versao);
  }

  definirIdempotencyKey(chave: string): void {
    this.props.idempotencyKey = chave;
  }

  submeter(): void {
    this.validarTransicao(StatusAvaliacao.ENVIADA);

    if (this.props.notas.size === 0) {
      throw new NenhumCriterioAvaliadoError();
    }

    if (!this.props.aceitePolitica) {
      throw new PoliticaNaoAceitaError();
    }

    this.props.status = StatusAvaliacao.ENVIADA;

    this.registrarEvento(
      new AvaliacaoSubmetidaEvent(
        this.props.id,
        this.props.investimentoId,
        this.props.clienteId,
      ),
    );
  }

  enviarParaModeracao(): void {
    this.validarTransicao(StatusAvaliacao.EM_MODERACAO);
    this.props.status = StatusAvaliacao.EM_MODERACAO;
  }

  aprovar(moderadorId: string): void {
    this.validarTransicao(StatusAvaliacao.APROVADA);
    this.props.status = StatusAvaliacao.APROVADA;

    this.registrarEvento(
      new AvaliacaoModeradaEvent(this.props.id, 'APROVADA', moderadorId),
    );
  }

  rejeitar(moderadorId: string, motivo: string): void {
    this.validarTransicao(StatusAvaliacao.REJEITADA);

    if (!motivo || motivo.trim().length === 0) {
      throw new MotivoRejeicaoObrigatorioError();
    }

    this.props.status = StatusAvaliacao.REJEITADA;

    this.registrarEvento(
      new AvaliacaoModeradaEvent(
        this.props.id,
        'REJEITADA',
        moderadorId,
        motivo,
      ),
    );
  }

  // --- Validacao de transicao (state machine) ---

  private validarTransicao(destino: StatusAvaliacao): void {
    const permitidas = TRANSICOES_PERMITIDAS[this.props.status];
    if (!permitidas.includes(destino)) {
      throw new TransicaoInvalidaError(this.props.status, destino);
    }
  }

  // Usado por metodos que exigem um status especifico atual (nao uma
  // transicao), como definirNota() so podendo ocorrer em RASCUNHO.
  private garantirTransicaoPermitida(statusExigido: StatusAvaliacao): void {
    if (this.props.status !== statusExigido) {
      throw new TransicaoInvalidaError(this.props.status, statusExigido);
    }
  }

  // --- Getters de leitura ---

  get id(): string {
    return this.props.id;
  }

  get investimentoId(): string {
    return this.props.investimentoId;
  }

  get clienteId(): string {
    return this.props.clienteId;
  }

  get status(): StatusAvaliacao {
    return this.props.status;
  }

  get comentario(): string | null {
    return this.props.comentario;
  }

  get notas(): ReadonlyMap<TipoCriterio, Nota> {
    return this.props.notas;
  }

  get aceitePolitica(): AceitePolitica | null {
    return this.props.aceitePolitica;
  }

  get idempotencyKey(): string | null {
    return this.props.idempotencyKey;
  }

  get snapshotInvestimento(): Readonly<SnapshotInvestimento> {
    return this.props.snapshotInvestimento;
  }
}
