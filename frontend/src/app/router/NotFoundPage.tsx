import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <h1 className="text-3xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground">Página não encontrada.</p>
      <Link to="/" className="text-primary underline-offset-4 hover:underline">
        Voltar ao início
      </Link>
    </main>
  )
}
