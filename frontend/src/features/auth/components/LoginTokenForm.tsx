import { KeyRound } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useLoginForm } from '../hooks/useLoginForm'

export function LoginTokenForm() {
  const { tokenInput, setTokenInput, error, handleSubmit } = useLoginForm()

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Cole o token de desenvolvimento para autenticar</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          <p>Gere um token rodando, na pasta do backend:</p>
          <code className="mt-1 block overflow-x-auto rounded bg-background px-2 py-1 text-xs text-foreground">
            npx ts-node -r tsconfig-paths/register src/scripts/gerar-token-teste.ts cliente
            cliente-teste-001
          </code>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="token">Token JWT</Label>
            <Input
              id="token"
              name="token"
              placeholder="eyJhbGciOiJSUzI1NiIs..."
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'token-error' : undefined}
            />
            {error ? (
              <p id="token-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
