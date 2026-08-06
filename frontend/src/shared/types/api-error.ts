import axios from 'axios'

interface NestErrorBody {
  message?: string | string[]
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as NestErrorBody | undefined
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(', ') : body.message
    }
  }
  return fallback
}
