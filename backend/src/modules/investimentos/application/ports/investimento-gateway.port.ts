export type MotivoEncerramentoExterno =
  'VENCIMENTO' | 'RESGATE_ANTECIPADO' | 'OUTRO';

export interface InvestimentoEncerrado {
  investimentoId: string;
  clienteId: string;
  tipoProduto: string;
  valorAplicado: number;
  dataAplicacao: Date;
  dataEncerramento: Date;
  motivoEncerramento: MotivoEncerramentoExterno;
}

export abstract class InvestimentoGatewayPort {
  abstract buscarInvestimentoEncerrado(
    investimentoId: string,
  ): Promise<InvestimentoEncerrado | null>;
}
