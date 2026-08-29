import { useQuery } from '@tanstack/react-query'
import { getMyCohorts } from '@/services/cohortes/cohorteService'
import type { Cohorte } from '@/types/cohorte'

export const myCohortKeys = {
  all: ['my-cohorts'] as const,
}

export function useMyCohorts() {
  return useQuery<Cohorte[]>({
    queryKey: myCohortKeys.all,
    queryFn: getMyCohorts,
    staleTime: 1000 * 60 * 5,
  })
}