import { useState } from 'react'
import { AlertCircle, ClipboardList, Landmark, Loader2, SearchX, Wallet } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { KpiCard } from '@/shared/components/KpiCard'
import { SearchInput } from '@/shared/components/SearchInput'
import { FiltroChips } from '@/shared/components/FiltroChips'
import { PaginacaoControls } from '@/shared/components/PaginacaoControls'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { STATUS_AVALIACAO_METADATA, type StatusAvaliacao } from '@/shared/types/avaliacao-status'
import { getErrorMessage } from '@/shared/types/api-error'
import { useConvitesAvaliacao } from '../hooks/use-convites-avaliacao'

const TAMANHO_PAGINA = 6
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

export function ConvitesAvaliacaoPage() {
  const [pagina, setPagina] = useState(1)
  const [status, setStatus] = useState<FiltroStatus>(FILTRO_TODAS)
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebouncedValue(busca, 300)

  const { data, isPending, isError, error } = useConvitesAvaliacao(pagina, TAMANHO_PAGINA, {
    status: status === FILTRO_TODAS ? undefined : status,
    q: buscaDebounced.trim() || undefined,
  })

  function handleStatusChange(novoStatus: FiltroStatus) {
    setStatus(novoStatus)
    setPagina(1)
  }

  function handleBuscaChange(novaBusca: string) {
    setBusca(novaBusca)
    setPagina(1)
  }

  const filtroAtivo = status !== FILTRO_TODAS || buscaDebounced.trim().length > 0
  const valorTotal = (data?.resumo.valorTotalAplicado ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <div className="flex w-full flex-col gap-6 p-6 py-10 md:p-8">
      <div>
        <h1 className="text-xl font-semibold">Investimentos encerrados</h1>
        <p className="text-sm text-muted-foreground">
          Avalie sua experiência com cada investimento que já foi encerrado.
        </p>
      </div>

      {!isPending && !isError && data.resumo.totalInvestimentos > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard
            label="Investimentos encerrados"
            value={String(data.resumo.totalInvestimentos)}
            icon={Landmark}
          />
          <KpiCard
            label="Aguardando avaliação"
            value={String(data.resumo.aguardandoAvaliacao)}
            icon={ClipboardList}
          />
          <KpiCard label="Valor total aplicado" value={valorTotal} icon={Wallet} />
        </div>
      )}

      {!isPending && !isError && (data.resumo.totalInvestimentos > 0 || filtroAtivo) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FiltroChips opcoes={OPCOES_STATUS} valorSelecionado={status} onSelecionar={handleStatusChange} />
          <SearchInput value={busca} onChange={handleBuscaChange} placeholder="Buscar por produto..." />
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
      ) : data.itens.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {filtroAtivo ? (
              <SearchX className="size-5" aria-hidden="true" />
            ) : (
              <ClipboardList className="size-5" aria-hidden="true" />
            )}
          </span>
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              {filtroAtivo ? 'Nenhum investimento encontrado' : 'Nenhum investimento encerrado ainda'}
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {filtroAtivo
                ? 'Ajuste a busca ou o filtro de status para ver outros resultados.'
                : 'Quando um dos seus investimentos for encerrado, ele aparece aqui para você avaliar.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.itens.map((convite) => (
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
          <PaginacaoControls
            pagina={pagina}
            total={data.total}
            tamanhoPagina={TAMANHO_PAGINA}
            onPaginaChange={setPagina}
          />
        </>
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
