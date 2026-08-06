import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { STATUS_AVALIACAO_METADATA } from '@/shared/types/avaliacao-status'
import { useAprovarAvaliacao } from '../hooks/use-aprovar-avaliacao'
import type { AvaliacaoModeracao } from '../types/moderacao.types'

interface ListaPendentesCardsProps {
  itens: AvaliacaoModeracao[]
  onRejeitar: (id: string) => void
  onVerDetalhes: (avaliacao: AvaliacaoModeracao) => void
}

function StatusBadge({ status }: { status: AvaliacaoModeracao['status'] }) {
  const meta = STATUS_AVALIACAO_METADATA[status]
  const Icon = meta.icon

  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs ${meta.className}`}
    >
      <Icon className="size-3" aria-hidden="true" />
      {meta.label}
    </span>
  )
}

export function ListaPendentesCards({ itens, onRejeitar, onVerDetalhes }: ListaPendentesCardsProps) {
  const aprovarMutation = useAprovarAvaliacao()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {itens.map((avaliacao) => (
        <Card key={avaliacao.id} className="gap-3 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardHeader className="p-0">
                <CardTitle className="text-base">{avaliacao.investimento.tipoProduto}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-1 text-sm text-muted-foreground">
                {avaliacao.investimento.valorAplicado.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </CardContent>
              <p className="truncate px-0 font-mono text-xs text-muted-foreground">
                Cliente: {avaliacao.clienteId}
              </p>
            </div>
            <StatusBadge status={avaliacao.status} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => onVerDetalhes(avaliacao)}>
              Ver detalhes
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={aprovarMutation.isPending}
              onClick={() => aprovarMutation.mutate(avaliacao.id)}
            >
              Aprovar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onRejeitar(avaliacao.id)}
            >
              Rejeitar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
