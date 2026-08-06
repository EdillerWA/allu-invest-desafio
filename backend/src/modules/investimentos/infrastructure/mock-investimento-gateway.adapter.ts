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
//
// Conjunto ampliado de proposito (varios produtos, motivos de encerramento
// e valores) pra listagem de convites (listarEncerradosPorCliente) nao
// mostrar sempre os mesmos itens repetidos — cliente-teste-001 tem 5
// investimentos aqui, a maioria sem avaliacao ainda no banco de dev.
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
  {
    investimentoId: 'investimento-004',
    clienteId: 'cliente-teste-001',
    tipoProduto: 'CDB Prefixado',
    valorAplicado: 15000,
    dataAplicacao: new Date('2024-11-20'),
    dataEncerramento: new Date('2026-05-20'),
    motivoEncerramento: 'VENCIMENTO',
  },
  {
    investimentoId: 'investimento-005',
    clienteId: 'cliente-teste-001',
    tipoProduto: 'LCA',
    valorAplicado: 3200,
    dataAplicacao: new Date('2025-04-02'),
    dataEncerramento: new Date('2026-06-15'),
    motivoEncerramento: 'RESGATE_ANTECIPADO',
  },
  {
    investimentoId: 'investimento-006',
    clienteId: 'cliente-teste-001',
    tipoProduto: 'Debenture Incentivada',
    valorAplicado: 22000,
    dataAplicacao: new Date('2023-02-01'),
    dataEncerramento: new Date('2026-07-01'),
    motivoEncerramento: 'VENCIMENTO',
  },
  {
    investimentoId: 'investimento-007',
    clienteId: 'cliente-teste-002',
    tipoProduto: 'Tesouro IPCA+',
    valorAplicado: 9500,
    dataAplicacao: new Date('2024-08-12'),
    dataEncerramento: new Date('2026-04-10'),
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

  listarEncerradosPorCliente(
    clienteId: string,
  ): Promise<InvestimentoEncerrado[]> {
    return Promise.resolve(
      FIXTURES.filter((item) => item.clienteId === clienteId),
    );
  }
}
