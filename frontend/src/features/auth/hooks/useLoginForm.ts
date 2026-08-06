import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from './useAuth'

const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

export function useLoginForm() {
  const [tokenInput, setTokenInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = tokenInput.trim()

    if (!trimmed) {
      setError('Cole o token gerado pelo script de desenvolvimento.')
      return
    }
    if (!JWT_SHAPE.test(trimmed)) {
      setError('O token não parece um JWT válido (esperado 3 segmentos separados por ".").')
      return
    }

    setError(null)
    login(trimmed)
    navigate('/', { replace: true })
  }

  return { tokenInput, setTokenInput, error, handleSubmit }
}
