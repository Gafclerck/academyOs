import API from '@/api/api'
import type { ResetPasswordRequest } from '@/types/auth'

interface MessageResponse {
  detail: string
}

export const forgotPasswordService = async (
  email: string,
): Promise<MessageResponse> => {
  const response = await API.post<MessageResponse>(
    '/auth/forgot-password/',
    {
      email,
    },
  )

  return response.data
}

export const resetPasswordService = async (
  payload: ResetPasswordRequest,
): Promise<MessageResponse> => {
  const response = await API.post<MessageResponse>(
    '/auth/reset-password/',
    payload,
  )

  return response.data
}
