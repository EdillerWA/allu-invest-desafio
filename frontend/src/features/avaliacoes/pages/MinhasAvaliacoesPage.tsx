import { useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useMinhasAvaliacoes } from '../hooks/use-minhas-avaliacoes'
import { CardAvaliacao } from '../components/CardAvaliacao'
import { PaginacaoControls } from '@/shared/components/PaginacaoControls'
import { getErrorMessage } from '@/shared/types/api-error'

const TAMANHO_PAGINA = 10

export function MinhasAvaliacoesPage() {
  const [pagina, setPagina] = useState(1)
  const { data, isPending, isError, error } = useMinhasAvaliacoes(pagina, TAMANHO_PAGINA)

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-4 p-4 py-10">
      <h1 className="text-xl font-semibold">Minhas avaliações</h1>

      {isPending ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-2 py-10 text-muted-foreground"
        >
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <span>Carregando avaliações...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          {getErrorMessage(error, 'Não foi possível carregar suas avaliações.')}
        </div>
      ) : data.itens.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Você ainda não enviou nenhuma avaliação.
        </p>
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
    </main>
  )
}
