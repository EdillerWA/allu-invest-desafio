import { Button } from '@/shared/ui/button'
import { calcularTotalPaginas } from '@/shared/lib/paginacao'

interface PaginacaoControlsProps {
  pagina: number
  total: number
  tamanhoPagina: number
  onPaginaChange: (pagina: number) => void
}

export function PaginacaoControls({
  pagina,
  total,
  tamanhoPagina,
  onPaginaChange,
}: PaginacaoControlsProps) {
  const totalPaginas = calcularTotalPaginas(total, tamanhoPagina)

  if (totalPaginas <= 1) {
    return null
  }

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between gap-4 pt-2"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pagina <= 1}
        onClick={() => onPaginaChange(pagina - 1)}
      >
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        Página {pagina} de {totalPaginas}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pagina >= totalPaginas}
        onClick={() => onPaginaChange(pagina + 1)}
      >
        Próxima
      </Button>
    </nav>
  )
}
