import API from '@/api/api'

import type {
  RegisterRequest,
  User,
} from '@/types/auth'

export const registerService = async (
  payload: RegisterRequest,
): Promise<User> => {
  const response = await API.post<User>(
    '/auth/register/',
    payload,
  )

  return response.data
}

export default registerService   