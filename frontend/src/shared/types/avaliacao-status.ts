import { CircleCheck, CircleX, Clock, FileEdit, Send, type LucideIcon } from 'lucide-react'

export type StatusAvaliacao = 'RASCUNHO' | 'ENVIADA' | 'EM_MODERACAO' | 'APROVADA' | 'REJEITADA'

interface StatusAvaliacaoMetadata {
  label: string
  icon: LucideIcon
  className: string
}

/** Classes só com tokens já existentes (primary/secondary/muted/destructive) — zero cor nova. */
export const STATUS_AVALIACAO_METADATA: Record<StatusAvaliacao, StatusAvaliacaoMetadata> = {
  RASCUNHO: { label: 'Rascunho', icon: FileEdit, className: 'bg-muted text-muted-foreground' },
  ENVIADA: { label: 'Enviada', icon: Send, className: 'bg-muted text-foreground' },
  EM_MODERACAO: { label: 'Em moderação', icon: Clock, className: 'bg-secondary/10 text-secondary' },
  APROVADA: { label: 'Aprovada', icon: CircleCheck, className: 'bg-primary/10 text-primary' },
  REJEITADA: { label: 'Rejeitada', icon: CircleX, className: 'bg-destructive/10 text-destructive' },
}
