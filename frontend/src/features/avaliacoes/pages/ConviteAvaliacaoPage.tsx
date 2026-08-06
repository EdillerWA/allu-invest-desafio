import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Loader2 } from 'lucide-react'
import { STATUS_AVALIACAO_METADATA } from '@/shared/types/avaliacao-status'
import { getErrorMessage } from '@/shared/types/api-error'
import { obterConvite } from '../services/avaliacoes.service'
import { FormularioAvaliacao } from '../components/FormularioAvaliacao'
import { avaliacoesKeys } from '../lib/query-keys'

export function ConviteAvaliacaoPage() {
  const { investimentoId } = useParams<{ investimentoId: string }>()

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: avaliacoesKeys.convite(investimentoId as string),
    queryFn: () => obterConvite(investimentoId as string),
    enabled: investimentoId !== undefined,
  })

  if (isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-4">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-2 text-muted-foreground"
        >
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <span>Carregando convite...</span>
        </div>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-4">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border bg-card p-6 text-center shadow-sm">
          <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(error, 'Não foi possível carregar o convite.')}
          </p>
        </div>
      </main>
    )
  }

  const { investimento, avaliacaoExistente } = data

  return (
    <main className="flex min-h-svh items-start justify-center bg-background p-4 py-10">
      {avaliacaoExistente ? (
        <StatusAvaliacaoExistente
          status={avaliacaoExistente.status}
          motivoRejeicao={avaliacaoExistente.motivoRejeicao}
        />
      ) : (
        <FormularioAvaliacao
          investimentoId={investimentoId as string}
          investimento={investimento}
          onSubmitted={() => refetch()}
        />
      )}
    </main>
  )
}

interface StatusAvaliacaoExistenteProps {
  status: keyof typeof STATUS_AVALIACAO_METADATA
  motivoRejeicao: string | null
}

function StatusAvaliacaoExistente({ status, motivoRejeicao }: StatusAvaliacaoExistenteProps) {
  const meta = STATUS_AVALIACAO_METADATA[status]
  const Icon = meta.icon

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm">
      <Icon className="size-8" aria-hidden="true" />
      <p className="font-medium">Sua avaliação já foi enviada</p>
      <span className={`rounded-full px-3 py-1 text-sm ${meta.className}`}>{meta.label}</span>
      <p className="text-sm text-muted-foreground">
        Ela passa por moderação antes de qualquer publicação. Você será informado quando o status
        mudar.
      </p>
      {motivoRejeicao && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Motivo: {motivoRejeicao}
        </p>
      )}
    </div>
  )
}
