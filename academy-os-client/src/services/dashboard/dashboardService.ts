import API from '@/api/api'

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

  recent_evaluations: RecentEvaluation[]
}

export interface RecentEvaluation {
  score: number | null
  evaluated_by: string | null
  updated_at: string
}

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
  submitted_at: string | null
  repo_url: string
  live_url: string
}

export interface TrainerCohortSummary {
  cohort_id: string
  cohort_name: string
  program_name: string
  status: string
  start_date: string | null
  end_date: string | null
  learners_count: number
  average_progress: number
}

export interface TrainerRecentReview {
  deliverable_id: string
  learner_name: string
  cohort_name: string
  project_title: string
  status: string
  score: number | null
  reviewed_at: string | null
}

export interface TrainerDashboardStats {
  total_assigned_cohorts: number
  total_students: number
  direct_mentees_count: number
  pending_reviews_count: number
  pending_reviews: TrainerPendingReview[]
  cohorts_summary: TrainerCohortSummary[]
  recent_reviews: TrainerRecentReview[]
}

export interface ProjectStatItem {
  project_id: string
  title: string
  order: number
  total_criteria_count: number
  total_learners_count: number
  evaluated_count: number
  validated_count: number
  revision_count: number
  pending_count: number
  validation_percentage: number
  average_score: number | null
}

export interface CompetencyStatItem {
  competency_name: string
  average_score: number | null
  mastered_count: number
  acquired_count: number
  in_progress_count: number
  not_acquired_count: number
}

export interface LearnerProgressItem {
  enrollment_id: string
  user_id: string
  full_name: string
  email: string
  mentor_name: string | null
  validated_projects_count: number
  total_projects_count: number
  progress_percentage: number
  average_score: number | null
  status: string
}

export interface LearnerAtRiskItem {
  enrollment_id: string
  user_id: string
  full_name: string
  email: string
  progress_percentage: number
  reason: string
}

export interface CohortDetailedStats {
  cohort_id: string
  cohort_name: string
  program_id: string
  program_name: string
  status: string
  start_date: string | null
  end_date: string | null
  total_learners: number
  active_learners: number
  completed_learners: number
  dropped_learners: number
  suspended_learners: number
  total_trainers: number
  assigned_mentors_count: number
  unassigned_mentors_count: number
  total_projects: number
  average_progress: number
  validation_rate: number
  completion_rate: number
  average_score: number | null
  projects_stats: ProjectStatItem[]
  competency_stats: CompetencyStatItem[]
  learners_progress: LearnerProgressItem[]
  learners_at_risk_count: number
  learners_at_risk: LearnerAtRiskItem[]
}

export interface EnrollmentProgressData {
  enrollment_id: string
  user_id: string
  full_name: string
  email: string
  cohort_name: string
  program_name: string
  mentor_name: string | null
  progress_percentage: number
  average_score: number | null
  status: string
  assignments: Array<{
    assignment_id: string
    project_id: string
    project_title: string
    order: number
    status: string
    final_score: number | null
    deliverables_count: number
    latest_deliverable: {
      id: string
      version: number
      status: string
      score: number | null
      feedback: string
      submitted_at: string | null
      reviewed_at: string | null
      reviewed_by_name: string | null
    } | null
  }>
  competency_scores: Array<{
    competency_name: string
    average_score: number | null
    latest_level: string
  }>
}

export interface LearnerCurrentProject {
  assignment_id: string
  project_id: string
  title: string
  order: number
  description: string
  status: string
  deadline: string | null
}

export interface LearnerRecentDeliverable {
  id: string
  assignment_id: string
  project_title: string
  version: number
  status: string
  score: number | null
  feedback: string
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by_name: string | null
}

export interface LearnerCompetencyScore {
  competency_name: string
  average_score: number | null
  latest_level: string
}

export interface LearnerDashboardStats {
  has_enrollment: boolean
  enrollment_id: string | null
  cohort_id: string | null
  cohort_name: string | null
  program_name: string | null
  mentor_name: string | null
  mentor_email: string | null
  total_projects: number
  validated_projects: number
  progress_percentage: number
  average_score: number | null
  current_project: LearnerCurrentProject | null
  recent_deliverables: LearnerRecentDeliverable[]
  competency_scores: LearnerCompetencyScore[]
  certificate_status: string | null
  certificate_id: string | null
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await API.get<DashboardStats>('/dashboard/stats/')
    return response.data
  },

  async getTrainerDashboard(trainerId?: string): Promise<TrainerDashboardStats> {
    const response = await API.get<TrainerDashboardStats>('/dashboard/trainer/', {
      params: trainerId ? { trainer: trainerId } : undefined,
    })
    return response.data
  },

  async getLearnerDashboard(cohortId?: string): Promise<LearnerDashboardStats> {
    const response = await API.get<LearnerDashboardStats>('/dashboard/learner/', {
      params: cohortId ? { cohort: cohortId } : undefined,
    })
    return response.data
  },

  async getCohortStats(cohortId: string): Promise<CohortDetailedStats> {
    const response = await API.get<CohortDetailedStats>(`/cohorts/${cohortId}/stats/`)
    return response.data
  },

  async getEnrollmentProgress(enrollmentId: string): Promise<EnrollmentProgressData> {
    const response = await API.get<EnrollmentProgressData>(`/enrollments/${enrollmentId}/progress/`)
    return response.data
  },
}
