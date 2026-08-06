import { useState } from 'react'
import { AlertCircle, ClipboardCheck, Inbox, Loader2, SearchX } from 'lucide-react'
import { useMinhasAvaliacoes } from '../hooks/use-minhas-avaliacoes'
import { CardAvaliacao } from '../components/CardAvaliacao'
import { PaginacaoControls } from '@/shared/components/PaginacaoControls'
import { KpiCard } from '@/shared/components/KpiCard'
import { SearchInput } from '@/shared/components/SearchInput'
import { FiltroChips } from '@/shared/components/FiltroChips'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { STATUS_AVALIACAO_METADATA, type StatusAvaliacao } from '@/shared/types/avaliacao-status'
import { getErrorMessage } from '@/shared/types/api-error'

const TAMANHO_PAGINA = 10
const FILTRO_TODAS = 'TODAS' as const
type FiltroStatus = typeof FILTRO_TODAS | StatusAvaliacao

const OPCOES_STATUS: { value: FiltroStatus; label: string }[] = [
  { value: FILTRO_TODAS, label: 'Todas' },
  { value: 'ENVIADA', label: STATUS_AVALIACAO_METADATA.ENVIADA.label },
  { value: 'EM_MODERACAO', label: STATUS_AVALIACAO_METADATA.EM_MODERACAO.label },
  { value: 'APROVADA', label: STATUS_AVALIACAO_METADATA.APROVADA.label },
  { value: 'REJEITADA', label: STATUS_AVALIACAO_METADATA.REJEITADA.label },
]

export function MinhasAvaliacoesPage() {
  const [pagina, setPagina] = useState(1)
  const [status, setStatus] = useState<FiltroStatus>(FILTRO_TODAS)
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebouncedValue(busca, 300)

  const { data, isPending, isError, error } = useMinhasAvaliacoes(pagina, TAMANHO_PAGINA, {
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

  return (
    <div className="flex w-full flex-col gap-6 p-6 py-10 md:p-8">
      <div>
        <h1 className="text-xl font-semibold">Minhas avaliações</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o status de cada avaliação que você enviou.
        </p>
      </div>

      {!isPending && !isError && (data.total > 0 || filtroAtivo) && (
        <div className="grid grid-cols-1 gap-3 sm:max-w-xs">
          <KpiCard label="Avaliações encontradas" value={String(data.total)} icon={ClipboardCheck} />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FiltroChips opcoes={OPCOES_STATUS} valorSelecionado={status} onSelecionar={handleStatusChange} />
        <SearchInput value={busca} onChange={handleBuscaChange} placeholder="Buscar por produto..." />
      </div>

      {isPending ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-2 py-16 text-muted-foreground"
        >
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <span>Carregando avaliações...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
          <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          {getErrorMessage(error, 'Não foi possível carregar suas avaliações.')}
        </div>
      ) : data.itens.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {filtroAtivo ? (
              <SearchX className="size-5" aria-hidden="true" />
            ) : (
              <Inbox className="size-5" aria-hidden="true" />
            )}
          </span>
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              {filtroAtivo ? 'Nenhuma avaliação encontrada' : 'Nenhuma avaliação ainda'}
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {filtroAtivo
                ? 'Ajuste a busca ou o filtro de status para ver outros resultados.'
                : 'Quando você avaliar a experiência de um investimento encerrado, ela aparece aqui.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.itens.map((avaliacao) => (
              <CardAvaliacao key={avaliacao.id} avaliacao={avaliacao} />
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
