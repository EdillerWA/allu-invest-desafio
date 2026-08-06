import { http } from '@/shared/lib/http'
import type { UsuarioAutenticado } from '../types/me.types'

export async function getMe(): Promise<UsuarioAutenticado> {
  const { data } = await http.get<UsuarioAutenticado>('/me')
  return data
}
