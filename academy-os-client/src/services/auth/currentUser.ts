import API from '@/api/api'
import type { User } from '@/types/auth'

export const getCurrentUserService = async (): Promise<User> => {
  const response = await API.get<User>('auth/me/')

  return response.data
}

export const updateMeService = async (
  data: Partial<Pick<
    User,
    'first_name' | 'last_name' | 'phone_number'
  >>,
): Promise<User> => {
  const response = await API.patch<User>(
    'auth/me/',
    data,
  )

  return response.data
}