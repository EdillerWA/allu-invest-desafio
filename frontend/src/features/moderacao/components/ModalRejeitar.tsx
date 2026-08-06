import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { Label } from '@/shared/ui/label'
import { useRejeitarAvaliacao } from '../hooks/use-rejeitar-avaliacao'

interface ModalRejeitarProps {
  avaliacaoId: string | null
  onOpenChange: (open: boolean) => void
}

export function ModalRejeitar({ avaliacaoId, onOpenChange }: ModalRejeitarProps) {
  const [motivo, setMotivo] = useState('')
  const mutation = useRejeitarAvaliacao()

  function handleOpenChange(open: boolean) {
    if (!open) {
      setMotivo('')
    }
    onOpenChange(open)
  }

  function handleConfirmar() {
    if (!avaliacaoId || motivo.trim().length === 0) {
      return
    }
    mutation.mutate(
      { id: avaliacaoId, motivo: motivo.trim() },
      { onSuccess: () => handleOpenChange(false) },
    )
  }

  return (
    <Dialog open={avaliacaoId !== null} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeitar avaliação</DialogTitle>
          <DialogDescription>
            Informe o motivo da rejeição. Ele fica registrado e disponível para o cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="motivo-rejeicao">Motivo</Label>
          <Textarea
            id="motivo-rejeicao"
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            placeholder="Explique por que esta avaliação está sendo rejeitada..."
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={motivo.trim().length === 0 || mutation.isPending}
            onClick={handleConfirmar}
          >
            {mutation.isPending ? 'Rejeitando...' : 'Rejeitar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
