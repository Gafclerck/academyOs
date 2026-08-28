import { useQuery } from '@tanstack/react-query'
import {
  dashboardService,
  type CohortDetailedStats,
} from '@/services/dashboard/dashboardService'

export const cohortStatsKeys = {
  all: ['cohort-stats'] as const,
  detail: (cohortId: string) => ['cohort-stats', cohortId] as const,
}

export function useCohortStats(cohortId: string) {
  return useQuery<CohortDetailedStats>({
    queryKey: cohortStatsKeys.detail(cohortId),
    queryFn: () => dashboardService.getCohortStats(cohortId),
    enabled: Boolean(cohortId),
    staleTime: 1000 * 60 * 2,
  })
}
