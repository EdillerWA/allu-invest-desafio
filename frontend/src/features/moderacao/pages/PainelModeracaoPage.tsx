import { useState } from 'react'
import { AlertCircle, CircleCheckBig, Hourglass, Loader2, SearchX } from 'lucide-react'
import { usePendentesModeracao } from '../hooks/use-pendentes-moderacao'
import { ListaPendentesCards } from '../components/ListaPendentesCards'
import { ModalRejeitar } from '../components/ModalRejeitar'
import { ModalDetalhesAvaliacao } from '../components/ModalDetalhesAvaliacao'
import { PaginacaoControls } from '@/shared/components/PaginacaoControls'
import { KpiCard } from '@/shared/components/KpiCard'
import { SearchInput } from '@/shared/components/SearchInput'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { getErrorMessage } from '@/shared/types/api-error'
import type { AvaliacaoModeracao } from '../types/moderacao.types'

const TAMANHO_PAGINA = 10

export function PainelModeracaoPage() {
  const [pagina, setPagina] = useState(1)
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebouncedValue(busca, 300)
  const [avaliacaoParaRejeitar, setAvaliacaoParaRejeitar] = useState<string | null>(null)
  const [avaliacaoParaVerDetalhes, setAvaliacaoParaVerDetalhes] = useState<AvaliacaoModeracao | null>(
    null,
  )

  const { data, isPending, isError, error } = usePendentesModeracao(
    pagina,
    TAMANHO_PAGINA,
    buscaDebounced.trim() || undefined,
  )

  function handleBuscaChange(novaBusca: string) {
    setBusca(novaBusca)
    setPagina(1)
  }

  const buscaAtiva = buscaDebounced.trim().length > 0

  return (
    <div className="flex w-full flex-col gap-6 p-6 py-10 md:p-8">
      <div>
        <h1 className="text-xl font-semibold">Painel de moderação</h1>
        <p className="text-sm text-muted-foreground">
          Avaliações aguardando aprovação ou rejeição antes de qualquer publicação.
        </p>
      </div>

      {!isPending && !isError && (data.total > 0 || buscaAtiva) && (
        <div className="grid grid-cols-1 gap-3 sm:max-w-xs">
          <KpiCard label="Aguardando moderação" value={String(data.total)} icon={Hourglass} />
        </div>
      )}

      <SearchInput value={busca} onChange={handleBuscaChange} placeholder="Buscar por produto ou cliente..." />

      {isPending ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-2 py-16 text-muted-foreground"
        >
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <span>Carregando avaliações pendentes...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
          <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          {getErrorMessage(error, 'Não foi possível carregar a fila de moderação.')}
        </div>
      ) : data.itens.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {buscaAtiva ? (
              <SearchX className="size-5" aria-hidden="true" />
            ) : (
              <CircleCheckBig className="size-5" aria-hidden="true" />
            )}
          </span>
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              {buscaAtiva ? 'Nenhuma avaliação encontrada' : 'Fila em dia'}
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {buscaAtiva
                ? 'Ajuste a busca para ver outros resultados.'
                : 'Nenhuma avaliação aguardando moderação no momento.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <ListaPendentesCards
            itens={data.itens}
            onRejeitar={(id) => setAvaliacaoParaRejeitar(id)}
            onVerDetalhes={(avaliacao) => setAvaliacaoParaVerDetalhes(avaliacao)}
          />
          <PaginacaoControls
            pagina={pagina}
            total={data.total}
            tamanhoPagina={TAMANHO_PAGINA}
            onPaginaChange={setPagina}
          />
        </>
      )}

      <ModalRejeitar
        avaliacaoId={avaliacaoParaRejeitar}
        onOpenChange={(open) => !open && setAvaliacaoParaRejeitar(null)}
      />
      <ModalDetalhesAvaliacao
        avaliacao={avaliacaoParaVerDetalhes}
        onOpenChange={(open) => !open && setAvaliacaoParaVerDetalhes(null)}
        onRejeitar={(id) => setAvaliacaoParaRejeitar(id)}
      />
    </div>
  )
}
