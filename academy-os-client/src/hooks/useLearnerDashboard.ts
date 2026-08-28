import { useQuery } from '@tanstack/react-query'
import {
  dashboardService,
  type LearnerDashboardStats,
} from '@/services/dashboard/dashboardService'

export const learnerDashboardKeys = {
  all: ['learner-dashboard'] as const,
}

export function useLearnerDashboard() {
  return useQuery<LearnerDashboardStats>({
    queryKey: learnerDashboardKeys.all,
    queryFn: () => dashboardService.getLearnerDashboard(),
    staleTime: 1000 * 60 * 2,
  })
}
