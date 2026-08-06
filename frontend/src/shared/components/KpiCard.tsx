import type { ComponentType } from 'react'

interface KpiCardProps {
  label: string
  value: string
  icon: ComponentType<{ className?: string }>
}

export function KpiCard({ label, value, icon: Icon }: KpiCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xl font-semibold text-foreground">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
