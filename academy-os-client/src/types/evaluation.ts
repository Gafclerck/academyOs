export type AssignmentStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'validated'
  | 'rejected'

export type DeliverableStatus =
  | 'submitted'
  | 'validated'
  | 'rejected'

export interface EvaluationCriterion {
  id: string
  project: string
  title: string
  competency_name: string
  max_score: number
  weight: number
  order: number
}

export interface CriterionScore {
  criterion: string
  score: number
  acquisition_level?: string
}

export interface ProjectAssignment {
  id: string
  enrollment: string
  project: string
  user_name?: string
  user_email?: string
  cohort?: string
  cohort_id?: string
  cohort_name?: string
  enrollment_id?: string
  project_title?: string
  project_order?: number
  deadline_override?: string | null
  status: AssignmentStatus
  final_score?: number | null
  created_at?: string
  updated_at?: string
}

export interface Attachment {
  id: string
  file: string
  filename?: string
  url?: string
}

export interface Deliverable {
  id: string
  assignment: string
  version: number
  repo_url?: string | null
  live_url?: string | null
  comments?: string | null
  status: DeliverableStatus
  submitted_by?: string
  submitted_by_email?: string
  submitted_by_name?: string
  reviewed_by?: string
  reviewed_by_email?: string | null
  score?: number | null
  feedback?: string | null
  submitted_at?: string
  reviewed_at?: string | null
  attachments?: Attachment[]
  criterion_scores?: CriterionScore[]
}

export interface CreateAssignmentDTO {
  enrollment: string
  project: string
  deadline_override?: string | null
}

export interface SubmitDeliverableDTO {
  repo_url?: string
  live_url?: string
  comments?: string
  files?: File[]
}

export interface ReviewDeliverableDTO {
  status: 'validated' | 'rejected'
  score?: number
  feedback?: string
  criterion_scores?: CriterionScore[]
}