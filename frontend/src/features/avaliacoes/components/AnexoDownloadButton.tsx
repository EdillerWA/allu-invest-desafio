import { useState } from 'react'
import { AlertCircle, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { baixarAnexo } from '../services/avaliacoes.service'
import type { AnexoResposta } from '../types/avaliacao.types'

interface AnexoDownloadButtonProps {
  avaliacaoId: string
  anexo: AnexoResposta
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type EstadoDownload = 'ocioso' | 'baixando' | 'erro'

export function AnexoDownloadButton({ avaliacaoId, anexo }: AnexoDownloadButtonProps) {
  const [estado, setEstado] = useState<EstadoDownload>('ocioso')

  async function handleDownload() {
    setEstado('baixando')
    try {
      const blob = await baixarAnexo(avaliacaoId, anexo.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = anexo.nomeOriginal
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setEstado('ocioso')
    } catch {
      setEstado('erro')
      toast.error(`Não foi possível baixar "${anexo.nomeOriginal}".`)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={estado === 'baixando'}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70',
        estado === 'erro' && 'text-destructive hover:bg-destructive/10',
      )}
    >
      {estado === 'baixando' ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
      ) : estado === 'erro' ? (
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
      ) : (
        <Download className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1 truncate">{anexo.nomeOriginal}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{formatarTamanho(anexo.tamanhoBytes)}</span>
    </button>
  )
}
