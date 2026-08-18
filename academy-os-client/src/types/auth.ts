export type UserRole =
  | 'admin'
  | 'organizer'
  | 'trainer'
  | 'learner'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: UserRole
  phone_number: string | null
  created_at: string
  avatar?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface JwtAuthTokens {
  access: string
  refresh: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  code: string
  new_password: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

export interface RegisterRequest {
  email: string
  first_name: string
  last_name: string
  password: string
  phone_number?: string
  role?: UserRole
}

export interface AuthContextType {
  user: User | null
  tokens: JwtAuthTokens | null
  isAuthenticated: boolean
  loading: boolean
  login: (
    credentials: LoginCredentials,
  ) => Promise<void>
  logout: () => Promise<void>
  refreshUserProfile: () => Promise<User | null>
}