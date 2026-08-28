import { useQuery } from '@tanstack/react-query'
import {
  dashboardService,
  type TrainerDashboardStats,
} from '@/services/dashboard/dashboardService'

export const trainerDashboardKeys = {
  all: ['trainer-dashboard'] as const,
  detail: (trainerId?: string) => ['trainer-dashboard', trainerId] as const,
}

export function useTrainerDashboard(trainerId?: string) {
  return useQuery<TrainerDashboardStats>({
    queryKey: trainerDashboardKeys.detail(trainerId),
    queryFn: () => dashboardService.getTrainerDashboard(trainerId),
    staleTime: 1000 * 60 * 2,
  })
}
