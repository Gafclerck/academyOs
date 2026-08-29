export type StatutCohorte =
  | 'upcoming'
  | 'ongoing'
  | 'completed'
  | 'active'
  | 'inactive'

export interface Cohorte {
  id: string

  name: string
  description?: string | null

  status: string

  program?: string | null
  program_name?: string | null

  intake?: string | null
  intake_name?: string | null

  enrollment_status?: string | null
  enrolled_at?: string | null

  start_date?: string | null
  end_date?: string | null

  members_count?: number
  enrollments_count?: number
  projects_count?: number

  created_at?: string
  updated_at?: string
}

export interface CreateCohorteDTO {
  name: string
  description?: string
  program: string
  intake: string
  start_date: string
  end_date: string
  status: StatutCohorte
}

export interface UpdateCohorteDTO {
  name?: string
  description?: string
  program?: string
  intake?: string
  start_date?: string
  end_date?: string
  status?: StatutCohorte
}