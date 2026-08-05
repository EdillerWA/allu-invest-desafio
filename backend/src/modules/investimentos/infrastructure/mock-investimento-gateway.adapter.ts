import { Injectable } from '@nestjs/common';
import {
  InvestimentoEncerrado,
  InvestimentoGatewayPort,
} from '@modules/investimentos/application/ports/investimento-gateway.port';

// Fixtures fixas, nao hash/derivacao do investimentoId — de proposito,
// pra tornar o cenario "investimento nao pertence ao cliente autenticado"
// trivialmente testavel via curl: gerar um token pra cliente-teste-001
// (gerar-token-teste.ts ja usa esse id como default) e tentar submeter
// avaliacao contra investimento-002, que pertence a cliente-teste-002.
const FIXTURES: InvestimentoEncerrado[] = [
  {
    investimentoId: 'investimento-001',
    clienteId: 'cliente-teste-001',
    tipoProduto: 'CDB Pos-fixado',
    valorAplicado: 5000,
    dataAplicacao: new Date('2025-01-10'),
    dataEncerramento: new Date('2026-01-10'),
    motivoEncerramento: 'VENCIMENTO',
  },
  {
    investimentoId: 'investimento-002',
    clienteId: 'cliente-teste-002',
    tipoProduto: 'LCI',
    valorAplicado: 12000,
    dataAplicacao: new Date('2024-06-01'),
    dataEncerramento: new Date('2026-02-01'),
    motivoEncerramento: 'RESGATE_ANTECIPADO',
  },
  {
    investimentoId: 'investimento-003',
    clienteId: 'cliente-teste-001',
    tipoProduto: 'Tesouro Selic',
    valorAplicado: 8000,
    dataAplicacao: new Date('2023-09-15'),
    dataEncerramento: new Date('2026-03-01'),
    motivoEncerramento: 'OUTRO',
  },
];

@Injectable()
export class MockInvestimentoGatewayAdapter implements InvestimentoGatewayPort {
  buscarInvestimentoEncerrado(
    investimentoId: string,
  ): Promise<InvestimentoEncerrado | null> {
    const fixture = FIXTURES.find(
      (item) => item.investimentoId === investimentoId,
    );
    return Promise.resolve(fixture ?? null);
  }
}
