import API from '@/api/api'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: 'admin' | 'organizer' | 'trainer' | 'learner'
  status: 'pending' | 'active' | 'suspended' | 'archived'
  phone_number: string | null
  is_active: boolean
  is_staff: boolean
  last_login: string | null
  password_reset_at: string | null
  created_at: string
  updated_at: string
}

interface UsersResponse {
  count: number
  next: string | null
  previous: string | null
  results: User[]
}

// ===============================
// RÉCUPÉRER LES UTILISATEURS
// ===============================

export const getUsers = async (): Promise<User[]> => {
  const response = await API.get<UsersResponse>('/users/')

  return response.data.results
}

// ===============================
// INVITER UN UTILISATEUR
// ===============================

export const inviteUser = async (
  email: string,
  role: 'learner' | 'trainer',
) => {
  const response = await API.post('/auth/invite/', {
    email,
    role,
  })

  return response.data
}