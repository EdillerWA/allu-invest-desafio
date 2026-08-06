import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { STATUS_AVALIACAO_METADATA } from '@/shared/types/avaliacao-status'
import type { AvaliacaoResposta } from '../types/avaliacao.types'

interface CardAvaliacaoProps {
  avaliacao: AvaliacaoResposta
}

export function CardAvaliacao({ avaliacao }: CardAvaliacaoProps) {
  const meta = STATUS_AVALIACAO_METADATA[avaliacao.status]
  const Icon = meta.icon

  return (
    <Link to={`/avaliacoes/${avaliacao.id}`} className="group block">
      <Card className="flex-row items-center gap-4 py-4 transition-colors group-hover:border-primary/40 group-hover:bg-accent/50">
        <CardHeader className="flex-1 gap-1">
          <CardTitle className="flex items-center gap-2">
            <span>{avaliacao.investimento.tipoProduto}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${meta.className}`}>
              <Icon className="size-3" aria-hidden="true" />
              {meta.label}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pr-2 text-sm text-muted-foreground">
          {avaliacao.investimento.valorAplicado.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </CardContent>
        <ChevronRight
          className="mr-4 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Card>
    </Link>
  )
}
