import { Fragment } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { STATUS_AVALIACAO_METADATA } from '@/shared/types/avaliacao-status'
import { CRITERIOS_AVALIACAO } from '@/shared/types/criterio-avaliacao'
import { useAprovarAvaliacao } from '../hooks/use-aprovar-avaliacao'
import type { AvaliacaoModeracao } from '../types/moderacao.types'

interface ModalDetalhesAvaliacaoProps {
  avaliacao: AvaliacaoModeracao | null
  onOpenChange: (open: boolean) => void
  onRejeitar: (id: string) => void
}

export function ModalDetalhesAvaliacao({
  avaliacao,
  onOpenChange,
  onRejeitar,
}: ModalDetalhesAvaliacaoProps) {
  const aprovarMutation = useAprovarAvaliacao()

  if (!avaliacao) {
    return <Dialog open={false} onOpenChange={onOpenChange} />
  }

  const meta = STATUS_AVALIACAO_METADATA[avaliacao.status]
  const notasPorCriterio = new Map(avaliacao.notas.map((nota) => [nota.criterio, nota.valor]))

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span>{avaliacao.investimento.tipoProduto}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${meta.className}`}>
              {meta.label}
            </span>
          </DialogTitle>
          <DialogDescription>
            Cliente <span className="font-mono">{avaliacao.clienteId}</span> ·{' '}
            {avaliacao.investimento.valorAplicado.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm">
          <div className="grid grid-cols-2 gap-y-2">
            {CRITERIOS_AVALIACAO.map(({ criterio, label }) => (
              <Fragment key={criterio}>
                <span className="text-muted-foreground">{label}</span>
                <span>{notasPorCriterio.get(criterio) ?? '—'}</span>
              </Fragment>
            ))}
          </div>

          {avaliacao.comentario && (
            <div className="space-y-1">
              <p className="font-medium text-foreground">Comentário</p>
              <p className="text-muted-foreground">{avaliacao.comentario}</p>
            </div>
          )}

          {avaliacao.anexos.length > 0 && (
            <div className="space-y-1">
              <p className="font-medium text-foreground">Anexos</p>
              <ul className="text-muted-foreground">
                {avaliacao.anexos.map((anexo) => (
                  <li key={anexo.nomeOriginal}>{anexo.nomeOriginal}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onOpenChange(false)
              onRejeitar(avaliacao.id)
            }}
          >
            Rejeitar
          </Button>
          <Button
            type="button"
            disabled={aprovarMutation.isPending}
            onClick={() =>
              aprovarMutation.mutate(avaliacao.id, { onSuccess: () => onOpenChange(false) })
            }
          >
            {aprovarMutation.isPending ? 'Aprovando...' : 'Aprovar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
