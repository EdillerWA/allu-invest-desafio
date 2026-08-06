import axios from 'axios'
import { getStoredToken } from '@/features/auth/services/auth-storage'
import { emitUnauthorized } from '@/features/auth/services/unauthorized-bridge'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

http.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      emitUnauthorized()
    }
    return Promise.reject(error)
  },
)
