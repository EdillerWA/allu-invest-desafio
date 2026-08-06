import { Fragment } from 'react'
import { Link, useParams } from 'react-router'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { STATUS_AVALIACAO_METADATA } from '@/shared/types/avaliacao-status'
import { CRITERIOS_AVALIACAO } from '@/shared/types/criterio-avaliacao'
import { getErrorMessage } from '@/shared/types/api-error'
import { useAvaliacaoDetalhe } from '../hooks/use-avaliacao-detalhe'

export function DetalheAvaliacaoPage() {
  const { id } = useParams<{ id: string }>()
  const { data: avaliacao, isPending, isError, error } = useAvaliacaoDetalhe(id)

  if (isPending) {
    return (
      <div className="flex min-h-full items-center justify-center p-4 py-16">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-2 text-muted-foreground"
        >
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <span>Carregando avaliação...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-full items-center justify-center p-4 py-16">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl bg-card p-6 text-center shadow-sm">
          <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(error, 'Avaliação não encontrada.')}
          </p>
          <Button variant="outline" asChild>
            <Link to="/minhas-avaliacoes">
              <ArrowLeft className="size-4" />
              Voltar para minhas avaliações
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const meta = STATUS_AVALIACAO_METADATA[avaliacao.status]
  const Icon = meta.icon
  const notasPorCriterio = new Map(avaliacao.notas.map((nota) => [nota.criterio, nota.valor]))

  return (
    <div className="flex w-full flex-col gap-4 p-6 py-10 md:p-8">
      <Link
        to="/minhas-avaliacoes"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Minhas avaliações
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>{avaliacao.investimento.tipoProduto}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${meta.className}`}>
                <Icon className="size-3" aria-hidden="true" />
                {meta.label}
              </span>
            </CardTitle>
            <CardDescription>
              {avaliacao.investimento.valorAplicado.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </CardDescription>
          </CardHeader>
          {avaliacao.motivoRejeicao && (
            <CardContent>
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Motivo da rejeição: {avaliacao.motivoRejeicao}
              </p>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Critérios avaliados</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
            {CRITERIOS_AVALIACAO.map(({ criterio, label }) => (
              <Fragment key={criterio}>
                <span className="text-muted-foreground">{label}</span>
                <span>{notasPorCriterio.get(criterio) ?? '—'}</span>
              </Fragment>
            ))}
          </CardContent>
        </Card>

        {avaliacao.comentario && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Comentário</CardTitle>
            </CardHeader>
            <CardContent className="max-w-2xl text-sm">{avaliacao.comentario}</CardContent>
          </Card>
        )}

        {avaliacao.anexos.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Anexos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground">
                {avaliacao.anexos.map((anexo) => (
                  <li key={anexo.nomeOriginal}>{anexo.nomeOriginal}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
