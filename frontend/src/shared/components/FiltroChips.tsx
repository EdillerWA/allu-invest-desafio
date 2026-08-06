import { cn } from '@/shared/lib/utils'

interface FiltroChip<T extends string> {
  value: T
  label: string
}

interface FiltroChipsProps<T extends string> {
  opcoes: FiltroChip<T>[]
  valorSelecionado: T
  onSelecionar: (valor: T) => void
}

export function FiltroChips<T extends string>({
  opcoes,
  valorSelecionado,
  onSelecionar,
}: FiltroChipsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por status">
      {opcoes.map((opcao) => {
        const ativo = opcao.value === valorSelecionado
        return (
          <button
            key={opcao.value}
            type="button"
            aria-pressed={ativo}
            onClick={() => onSelecionar(opcao.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              ativo
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {opcao.label}
          </button>
        )
      })}
    </div>
  )
}
