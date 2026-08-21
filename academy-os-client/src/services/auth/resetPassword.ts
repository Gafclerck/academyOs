import API from '@/api/api'

export interface ResetPasswordRequest {
  email: string
  code: string
  new_password: string
}

export interface ResetPasswordResponse {
  detail?: string
}

export const resetPassword = async (
  data: ResetPasswordRequest,
): Promise<ResetPasswordResponse> => {
  const response = await API.post<ResetPasswordResponse>(
    '/auth/reset-password/',
    data,
  )

  return response.data
}