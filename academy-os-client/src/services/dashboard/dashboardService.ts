import api from '@/api/api'
import { tokenStore } from '@/lib/tokenStore'

// =====================================================
// AXIOS — AUTHORIZATION
// =====================================================

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken()

  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// =====================================================
// TYPES COMMUNS
// =====================================================

export type DashboardRole =
  | 'admin'
  | 'organizer'
  | 'trainer'
  | 'learner'

// =====================================================
// DASHBOARD GLOBAL
// GET /api/v1/dashboard/stats/
// Admin / Organisateur
// =====================================================

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

  recent_evaluations: Array<Record<string, unknown>>
}

// =====================================================
// DASHBOARD FORMATEUR
// GET /api/v1/dashboard/trainer/
// =====================================================

export interface TrainerPendingReview {
  deliverable_id: string
  assignment_id: string
  learner_id: string
  learner_name: string
  learner_email: string
  cohort_id: string
  cohort_name: string
  project_title: string
  version: number
  submitted_at: string
  repo_url: string
  live_url: string
}

export interface TrainerCohortSummary {
  cohort_id: string
  cohort_name: string
  program_name: string
  status: string
  start_date: string
  end_date: string
  learners_count: number
  average_progress: number
}

export interface TrainerRecentReview {
  deliverable_id: string
  learner_name: string
  cohort_name: string
  project_title: string
  status: string
  score: number
  reviewed_at: string
}

export interface TrainerDashboard {
  total_assigned_cohorts: number
  total_students: number
  direct_mentees_count: number

  pending_reviews_count: number
  pending_reviews: TrainerPendingReview[]

  cohorts_summary: TrainerCohortSummary[]

  recent_reviews: TrainerRecentReview[]
}

// =====================================================
// DASHBOARD APPRENANT
// GET /api/v1/dashboard/learner/
// =====================================================

export interface LearnerDashboard {
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

  recent_evaluations: Array<Record<string, unknown>>

  cohorts_by_status?: Record<string, number>
  evaluations_by_status?: Record<string, number>
}

// =====================================================
// UNION
// =====================================================

export type DashboardData =
  | DashboardStats
  | TrainerDashboard
  | LearnerDashboard

// =====================================================
// HELPERS DE TYPE
// =====================================================

export const isGlobalDashboard = (
  data: DashboardData,
): data is DashboardStats => {
  return 'total_users' in data
}

export const isTrainerDashboard = (
  data: DashboardData,
): data is TrainerDashboard => {
  return 'total_assigned_cohorts' in data
}

export const isLearnerDashboard = (
  data: DashboardData,
): data is LearnerDashboard => {
  return (
    'global_completion_rate' in data &&
    !('total_users' in data) &&
    !('total_assigned_cohorts' in data)
  )
}

// =====================================================
// SERVICE
// =====================================================

export const dashboardService = {
  /**
   * Dashboard global
   *
   * GET /api/v1/dashboard/stats/
   *
   * Accessible principalement par ADMIN / ORGANIZER.
   */
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>(
      '/dashboard/stats/',
    )

    return response.data
  },

  /**
   * Dashboard formateur
   *
   * GET /api/v1/dashboard/trainer/
   *
   * Le backend identifie normalement le formateur
   * connecté automatiquement.
   *
   * Un admin/organizer peut éventuellement utiliser :
   * /dashboard/trainer/?trainer=<uuid>
   */
  async getTrainerDashboard(
    trainerId?: string,
  ): Promise<TrainerDashboard> {
    const response = await api.get<TrainerDashboard>(
      '/dashboard/trainer/',
      {
        params: trainerId
          ? {
              trainer: trainerId,
            }
          : undefined,
      },
    )

    return response.data
  },

  /**
   * Dashboard apprenant
   *
   * GET /api/v1/dashboard/learner/
   */
  async getLearnerDashboard(): Promise<LearnerDashboard> {
    const response = await api.get<LearnerDashboard>(
      '/dashboard/learner/',
    )

    return response.data
  },

  /**
   * Charge automatiquement le dashboard
   * correspondant au rôle de l'utilisateur connecté.
   */
  async getDashboard(
    role: DashboardRole,
  ): Promise<DashboardData> {
    switch (role) {
      case 'trainer':
        return this.getTrainerDashboard()

      case 'learner':
        return this.getLearnerDashboard()

      case 'admin':
      case 'organizer':
      default:
        return this.getStats()
    }
  },
}

export default dashboardService