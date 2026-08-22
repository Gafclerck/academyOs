import { useQuery } from '@tanstack/react-query'

import { getRentreeById } from '@/services/rentrees/rentreeService'
import type { Rentree } from '@/types/rentree'

export const useRentree = (id?: string) => {
  return useQuery<Rentree>({
    queryKey: ['rentree', id],
    queryFn: () => getRentreeById(id!),
    enabled: !!id,
  })
}

