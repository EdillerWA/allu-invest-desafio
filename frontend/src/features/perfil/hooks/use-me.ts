import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getMe } from '../services/me.service'

export function useMe() {
  const { token } = useAuth()

  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: token !== null,
  })
}
