const STORAGE_KEY = 'allu-invest:token'

/**
 * Único módulo que toca sessionStorage — sobrevive a F5 na mesma aba e se
 * autolimpa ao fechar a aba, coerente com o token não ter refresh (1h de vida).
 */
export function getStoredToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEY)
}

export function storeToken(token: string): void {
  sessionStorage.setItem(STORAGE_KEY, token)
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
