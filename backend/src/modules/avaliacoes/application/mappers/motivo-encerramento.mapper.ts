import { MotivoEncerramento } from '@modules/avaliacoes/domain/entities/avaliacao.entity';
import { MotivoEncerramentoExterno } from '@modules/investimentos/application/ports/investimento-gateway.port';

const MAPA_MOTIVO_ENCERRAMENTO: Record<
  MotivoEncerramentoExterno,
  MotivoEncerramento
> = {
  VENCIMENTO: MotivoEncerramento.VENCIMENTO,
  RESGATE_ANTECIPADO: MotivoEncerramento.RESGATE_ANTECIPADO,
  OUTRO: MotivoEncerramento.OUTRO,
};

// Fronteira da ACL: nao confia que o valor que chega do sistema externo
// (ja desserializado como MotivoEncerramentoExterno) de fato bate com um
// dos casos conhecidos. O compilador garante exaustividade do mapa; esta
// checagem cobre o que o compilador nao pode garantir em runtime.
export function traduzirMotivoEncerramento(
  valorExterno: MotivoEncerramentoExterno,
): MotivoEncerramento {
  const traduzido = MAPA_MOTIVO_ENCERRAMENTO[valorExterno];

  if (!traduzido) {
    throw new Error(
      `Motivo de encerramento desconhecido recebido do sistema externo: ${valorExterno}`,
    );
  }

  return traduzido;
}
