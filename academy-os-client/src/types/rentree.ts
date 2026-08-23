
export type StatutRentree =
  | 'upcoming'
  | 'ongoing'
  | 'completed'

export interface Rentree {
  id: string
  name: string
  start_date: string
  status: StatutRentree
  created_at: string
  updated_at: string
}

export interface CreateRentreeDTO {
  name: string
  start_date: string
  status: StatutRentree
}

export interface UpdateRentreeDTO {
  name?: string
  start_date?: string
  status?: StatutRentree
}

