import { useQuery } from '@tanstack/react-query'
import {
  dashboardService,
  type DashboardStats,
} from '../services/dashboard/dashboardService'

export const dashboardKeys = {
  stats: ['dashboard', 'stats'] as const,
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: dashboardKeys.stats,
    queryFn: () => dashboardService.getStats(),
  })
}