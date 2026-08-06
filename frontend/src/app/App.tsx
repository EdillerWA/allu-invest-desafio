import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/shared/ui/sonner'
import { AppProviders } from './providers/AppProviders'
import { AppRoutes } from './router/AppRoutes'

export function App() {
  return (
    <AppProviders>
      <AppRoutes />
      <Toaster />
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </AppProviders>
  )
}
