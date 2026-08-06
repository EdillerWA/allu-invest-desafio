import { useState } from 'react'
import { AlertCircle, ClipboardList, Landmark, Loader2, SearchX, Wallet } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { KpiCard } from '@/shared/components/KpiCard'
import { SearchInput } from '@/shared/components/SearchInput'
import { FiltroChips } from '@/shared/components/FiltroChips'
import { STATUS_AVALIACAO_METADATA, type StatusAvaliacao } from '@/shared/types/avaliacao-status'
import { getErrorMessage } from '@/shared/types/api-error'
import { useConvitesAvaliacao } from '../hooks/use-convites-avaliacao'
import type { ConviteResumo } from '../types/avaliacao.types'

const FILTRO_TODAS = 'TODAS' as const
const FILTRO_AGUARDANDO = 'AGUARDANDO' as const
type FiltroStatus = typeof FILTRO_TODAS | typeof FILTRO_AGUARDANDO | StatusAvaliacao

const OPCOES_STATUS: { value: FiltroStatus; label: string }[] = [
  { value: FILTRO_TODAS, label: 'Todos' },
  { value: FILTRO_AGUARDANDO, label: 'Aguardando avaliação' },
  { value: 'ENVIADA', label: STATUS_AVALIACAO_METADATA.ENVIADA.label },
  { value: 'EM_MODERACAO', label: STATUS_AVALIACAO_METADATA.EM_MODERACAO.label },
  { value: 'APROVADA', label: STATUS_AVALIACAO_METADATA.APROVADA.label },
  { value: 'REJEITADA', label: STATUS_AVALIACAO_METADATA.REJEITADA.label },
]

function aplicarFiltro(
  convites: ConviteResumo[],
  status: FiltroStatus,
  busca: string,
): ConviteResumo[] {
  const buscaNormalizada = busca.trim().toLowerCase()

  return convites.filter((convite) => {
    const combinaStatus =
      status === FILTRO_TODAS ||
      (status === FILTRO_AGUARDANDO ? !convite.avaliacaoId : convite.statusAvaliacao === status)
    const combinaBusca =
      buscaNormalizada.length === 0 ||
      convite.tipoProduto.toLowerCase().includes(buscaNormalizada)

    return combinaStatus && combinaBusca
  })
}

export function ConvitesAvaliacaoPage() {
  const { data, isPending, isError, error } = useConvitesAvaliacao()
  const [status, setStatus] = useState<FiltroStatus>(FILTRO_TODAS)
  const [busca, setBusca] = useState('')

  const pendentes = data?.filter((convite) => !convite.avaliacaoId).length ?? 0
  const valorTotal =
    data?.reduce((soma, convite) => soma + convite.valorAplicado, 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }) ?? 'R$ 0,00'

  const convitesFiltrados = data ? aplicarFiltro(data, status, busca) : []

  return (
    <div className="flex w-full flex-col gap-6 p-6 py-10 md:p-8">
      <div>
        <h1 className="text-xl font-semibold">Investimentos encerrados</h1>
        <p className="text-sm text-muted-foreground">
          Avalie sua experiência com cada investimento que já foi encerrado.
        </p>
      </div>

      {!isPending && !isError && data.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard label="Investimentos encerrados" value={String(data.length)} icon={Landmark} />
          <KpiCard label="Aguardando avaliação" value={String(pendentes)} icon={ClipboardList} />
          <KpiCard label="Valor total aplicado" value={valorTotal} icon={Wallet} />
        </div>
      )}

      {!isPending && !isError && data.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FiltroChips opcoes={OPCOES_STATUS} valorSelecionado={status} onSelecionar={setStatus} />
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por produto..." />
        </div>
      )}

      {isPending ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-2 py-16 text-muted-foreground"
        >
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <span>Carregando investimentos...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
          <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          {getErrorMessage(error, 'Não foi possível carregar seus investimentos.')}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ClipboardList className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Nenhum investimento encerrado ainda</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Quando um dos seus investimentos for encerrado, ele aparece aqui para você avaliar.
            </p>
          </div>
        </div>
      ) : convitesFiltrados.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SearchX className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Nenhum investimento encontrado</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Ajuste a busca ou o filtro de status para ver outros resultados.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {convitesFiltrados.map((convite) => (
            <Card key={convite.investimentoId} className="gap-3 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <CardHeader className="p-0">
                    <CardTitle className="text-base">{convite.tipoProduto}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 pt-1 text-sm text-muted-foreground">
                    {convite.valorAplicado.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </CardContent>
                </div>
                {convite.avaliacaoId && convite.statusAvaliacao ? (
                  <StatusBadge status={convite.statusAvaliacao} />
                ) : null}
              </div>

              {convite.avaliacaoId ? (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/avaliacoes/${convite.avaliacaoId}`}>Ver avaliação</Link>
                </Button>
              ) : (
                <Button size="sm" asChild>
                  <Link to={`/investimentos/${convite.investimentoId}/avaliar`}>Avaliar agora</Link>
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: keyof typeof STATUS_AVALIACAO_METADATA }) {
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
