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
      <div className="flex w-full flex-col gap-6 p-6 py-10 md:p-8">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-start gap-2 text-muted-foreground"
        >
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <span>Carregando convite...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex w-full flex-col gap-6 p-6 py-10 md:p-8">
        <div className="flex w-full max-w-md flex-col items-start gap-4 rounded-2xl bg-card p-6 shadow-sm">
          <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(error, 'Não foi possível carregar o convite.')}
          </p>
        </div>
      </div>
    )
  }

  const { investimento, avaliacaoExistente } = data

  return (
    <div className="flex w-full flex-col gap-6 p-6 py-10 md:p-8">
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
    </div>
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
    <div className="flex w-full max-w-2xl flex-col items-start gap-3 rounded-2xl bg-card p-6 shadow-sm">
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
