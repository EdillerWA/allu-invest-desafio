import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [valorDebounced, setValorDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setValorDebounced(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return valorDebounced
}
