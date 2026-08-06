import { useState, type ChangeEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card'
import { Textarea } from '@/shared/ui/textarea'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import {
  CRITERIOS_AVALIACAO,
  NOTA_MINIMA,
  NOTA_MAXIMA,
  type CriterioAvaliacao,
} from '@/shared/types/criterio-avaliacao'
import { getErrorMessage } from '@/shared/types/api-error'
import { criarAvaliacao } from '../services/avaliacoes.service'
import type { InvestimentoConvite } from '../types/avaliacao.types'

const OPCOES_NOTA = Array.from(
  { length: NOTA_MAXIMA - NOTA_MINIMA + 1 },
  (_, indice) => NOTA_MINIMA + indice,
)

interface FormularioAvaliacaoProps {
  investimentoId: string
  investimento: InvestimentoConvite
  onSubmitted: () => void
}

export function FormularioAvaliacao({
  investimentoId,
  investimento,
  onSubmitted,
}: FormularioAvaliacaoProps) {
  const [notas, setNotas] = useState<Partial<Record<CriterioAvaliacao, number>>>({})
  const [comentario, setComentario] = useState('')
  const [arquivos, setArquivos] = useState<File[]>([])
  const [aceitePolitica, setAceitePolitica] = useState(false)
  const [idempotencyKey] = useState(() => crypto.randomUUID())

  const mutation = useMutation({
    mutationFn: () =>
      criarAvaliacao(
        {
          investimentoId,
          // Botão de envio só habilita quando todos os critérios têm nota.
          notas: CRITERIOS_AVALIACAO.map(({ criterio }) => ({
            criterio,
            valor: notas[criterio] as number,
          })),
          comentario,
          versaoPolitica: '1.0',
          anexos: arquivos,
        },
        idempotencyKey,
      ),
    onSuccess: () => {
      toast.success('Avaliação enviada com sucesso.')
      onSubmitted()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Não foi possível enviar a avaliação.'))
    },
  })

  const todasNotasPreenchidas = CRITERIOS_AVALIACAO.every(
    ({ criterio }) => notas[criterio] !== undefined,
  )
  const podeSubmeter = todasNotasPreenchidas && aceitePolitica && !mutation.isPending

  function handleArquivosChange(event: ChangeEvent<HTMLInputElement>) {
    setArquivos(Array.from(event.target.files ?? []))
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{investimento.tipoProduto}</CardTitle>
          <CardDescription>Investimento encerrado</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted-foreground">Valor aplicado</span>
          <span>
            {investimento.valorAplicado.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
          <span className="text-muted-foreground">Data de aplicação</span>
          <span>{new Date(investimento.dataAplicacao).toLocaleDateString('pt-BR')}</span>
          <span className="text-muted-foreground">Data de encerramento</span>
          <span>{new Date(investimento.dataEncerramento).toLocaleDateString('pt-BR')}</span>
          <span className="text-muted-foreground">Motivo do encerramento</span>
          <span>{investimento.motivoEncerramento}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avalie sua experiência</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {CRITERIOS_AVALIACAO.map(({ criterio, label }) => (
              <div key={criterio} className="flex flex-col gap-1.5">
                <Label>{label}</Label>
                <div className="flex gap-1">
                  {OPCOES_NOTA.map((valor) => (
                    <Button
                      key={valor}
                      type="button"
                      variant={notas[criterio] === valor ? 'default' : 'outline'}
                      size="icon-sm"
                      onClick={() => setNotas((prev) => ({ ...prev, [criterio]: valor }))}
                    >
                      {valor}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comentario">Comentário (opcional)</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(event) => setComentario(event.target.value)}
              placeholder="Conte como foi sua experiência..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="anexos">Anexos (opcional)</Label>
            <input
              id="anexos"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleArquivosChange}
              className="text-sm"
            />
            {arquivos.length > 0 && (
              <ul className="text-sm text-muted-foreground">
                {arquivos.map((arquivo) => (
                  <li key={arquivo.name}>{arquivo.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="aceite"
              checked={aceitePolitica}
              onCheckedChange={(checked) => setAceitePolitica(checked === true)}
            />
            <Label htmlFor="aceite">Li e aceito os Termos de Avaliação da allu invest</Label>
          </div>

          <Button type="button" disabled={!podeSubmeter} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Enviando...' : 'Enviar avaliação'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
