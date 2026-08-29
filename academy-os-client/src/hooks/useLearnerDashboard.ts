import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  dashboardService,
  type LearnerDashboardStats,
} from '@/services/dashboard/dashboardService'

export const learnerDashboardKeys = {
  all: ['learner-dashboard'] as const,
}

export function useLearnerDashboard(cohortId?: string) {
  const queryKey = cohortId
    ? [...learnerDashboardKeys.all, cohortId]
    : learnerDashboardKeys.all
  return useQuery<LearnerDashboardStats>({
    queryKey,
    queryFn: () => dashboardService.getLearnerDashboard(cohortId),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  })
}