import API from '@/api/api'
import type {
  LoginCredentials,
  JwtAuthTokens,
} from '@/types/auth'

export const loginService = async (
  credentials: LoginCredentials,
): Promise<JwtAuthTokens> => {
  const response = await API.post<JwtAuthTokens>(
    'auth/login/',
    credentials,
  )

  return response.data
}

export default loginService