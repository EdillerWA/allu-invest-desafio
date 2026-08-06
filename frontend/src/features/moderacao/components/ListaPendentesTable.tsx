import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { useAprovarAvaliacao } from '../hooks/use-aprovar-avaliacao'
import type { AvaliacaoModeracao } from '../types/moderacao.types'

interface ListaPendentesTableProps {
  itens: AvaliacaoModeracao[]
  onRejeitar: (id: string) => void
}

export function ListaPendentesTable({ itens, onRejeitar }: ListaPendentesTableProps) {
  const aprovarMutation = useAprovarAvaliacao()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {itens.map((avaliacao) => (
          <TableRow key={avaliacao.id}>
            <TableCell>{avaliacao.investimento.tipoProduto}</TableCell>
            <TableCell className="font-mono text-xs">{avaliacao.clienteId}</TableCell>
            <TableCell>
              <Badge variant="secondary">{avaliacao.status}</Badge>
            </TableCell>
            <TableCell className="flex justify-end gap-2">
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
