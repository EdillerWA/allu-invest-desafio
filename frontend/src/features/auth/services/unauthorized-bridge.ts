const UNAUTHORIZED_EVENT = 'allu-invest:unauthorized'

/**
 * Ponte via CustomEvent do DOM entre o cliente HTTP (shared/lib/http.ts, que
 * não pode depender de React Router) e o AuthProvider (que sabe como navegar).
 * Evita import circular entre shared e features/auth.
 */
export function emitUnauthorized(): void {
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
}

export function onUnauthorized(handler: () => void): () => void {
  window.addEventListener(UNAUTHORIZED_EVENT, handler)
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler)
}
