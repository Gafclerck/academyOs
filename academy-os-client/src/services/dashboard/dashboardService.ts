import axios from 'axios'
import { tokenStore } from '@/lib/tokenStore'

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ??
    'http://localhost:8000/api/v1',

  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },

  timeout: 10_000,
})

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export interface DashboardStats {
  total_users: number
  total_learners: number
  active_learners: number
  pending_learners: number

  total_trainers: number
  total_organizers: number
  total_admins: number

  total_programs: number
  active_programs: number

  total_cohorts: number
  active_cohorts: number
  upcoming_cohorts: number
  completed_cohorts: number

  total_projects: number
  published_projects: number

  total_evaluations: number
  total_validated_evaluations: number
  total_rejected_evaluations: number
  total_pending_evaluations: number

  total_certificates: number
  issued_certificates: number
  pending_certificates: number

  global_completion_rate: number
  global_validation_rate: number
  average_score: number
  learners_per_cohort_avg: number

  cohorts_by_status: Record<string, number>
  enrollments_by_status: Record<string, number>
  evaluations_by_status: Record<string, number>
  competency_levels_distribution: Record<string, number>

  recent_evaluations: Array<Record<string, string>>
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>(
      '/dashboard/stats/'
    )

    return response.data
  },
}